package rw.ac.uok.aisps.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import rw.ac.uok.aisps.domain.*;
import rw.ac.uok.aisps.dto.MlPredictRequest;
import rw.ac.uok.aisps.dto.MlPredictResponse;
import rw.ac.uok.aisps.exception.ResourceNotFoundException;
import rw.ac.uok.aisps.repository.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PredictionService {

    private final StudentRepository studentRepository;
    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final AttendanceRepository attendanceRepository;
    private final AssessmentRepository assessmentRepository;
    private final PredictionRepository predictionRepository;
    private final RecommendationRepository recommendationRepository;
    private final MlClientService mlClientService;
    private final RecommendationEngine recommendationEngine;
    private final NotificationService notificationService;

    @Transactional
    public Prediction generateForStudentCourse(Long studentId, Long courseId, String semester) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found: " + studentId));
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found: " + courseId));

        RiskLevel previousRisk = predictionRepository
                .findTopByStudent_IdAndCourse_IdOrderByGeneratedAtDesc(studentId, courseId)
                .map(Prediction::getRiskLevel)
                .orElse(null);

        Attendance attendance = attendanceRepository
                .findByStudent_IdAndCourse_IdAndSemester(studentId, courseId, semester)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No attendance record for this student/course/semester -- upload data first"));
        Assessment assessment = assessmentRepository
                .findByStudent_IdAndCourse_IdAndSemester(studentId, courseId, semester)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No assessment record for this student/course/semester -- upload data first"));

        double attendanceRate = attendance.getAttendanceRate();
        BigDecimal caScore = assessment.getCaScore();
        BigDecimal assignmentCompletion = assessment.getAssignmentCompletion();
        double previousGpa = student.getPreviousGpa() != null ? student.getPreviousGpa().doubleValue() : 2.0;

        MlPredictResponse mlResponse = mlClientService.predict(new MlPredictRequest(
                attendanceRate,
                caScore != null ? caScore.doubleValue() : 0.0,
                assignmentCompletion != null ? assignmentCompletion.doubleValue() : 0.0,
                previousGpa
        ));

        Prediction prediction = Prediction.builder()
                .student(student)
                .course(course)
                .semester(semester)
                .modelUsed(mlResponse.modelUsed())
                .riskLevel(RiskLevel.valueOf(mlResponse.riskLevel().toUpperCase()))
                .confidenceScore(BigDecimal.valueOf(mlResponse.confidence() * 100)
                        .setScale(2, RoundingMode.HALF_UP))
                .build();
        prediction = predictionRepository.save(prediction);

        List<Recommendation> recommendations = recommendationEngine.generate(
                prediction, attendanceRate, caScore, assignmentCompletion);
        recommendationRepository.saveAll(recommendations);

        boolean newlyHighRisk = prediction.getRiskLevel() == RiskLevel.HIGH && previousRisk != RiskLevel.HIGH;
        if (newlyHighRisk) {
            notificationService.notifyHighRisk(prediction);
        }

        return prediction;
    }

    /**
     * Bulk variant of generateForStudentCourse(): loads students, attendance,
     * assessments, and prior predictions for the whole course in a handful
     * of queries (rather than ~5 queries per student), and predicts every
     * student in one call to the ML service instead of one call each. For a
     * course with hundreds or thousands of enrolled students, the per-student
     * version turns into thousands of sequential round-trips and can time
     * out; this does the same work in a small constant number of round-trips.
     * Students missing attendance or assessment data are skipped rather than
     * aborting the whole course, since a partial data upload is expected.
     */
    @Transactional
    public List<Prediction> generateForCourse(Long courseId, String semester) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found: " + courseId));

        List<Enrollment> enrollments = enrollmentRepository.findByCourse_IdAndSemester(courseId, semester);
        if (enrollments.isEmpty()) {
            return List.of();
        }
        List<Long> studentIds = enrollments.stream().map(e -> e.getStudent().getId()).distinct().toList();

        Map<Long, Student> studentById = studentRepository.findAllById(studentIds).stream()
                .collect(Collectors.toMap(Student::getId, s -> s));
        Map<Long, Attendance> attendanceByStudentId = attendanceRepository
                .findByCourse_IdAndSemester(courseId, semester).stream()
                .collect(Collectors.toMap(a -> a.getStudent().getId(), a -> a));
        Map<Long, Assessment> assessmentByStudentId = assessmentRepository
                .findByCourse_IdAndSemester(courseId, semester).stream()
                .collect(Collectors.toMap(a -> a.getStudent().getId(), a -> a));

        Map<Long, RiskLevel> previousRiskByStudentId = new HashMap<>();
        predictionRepository.findByCourse_Id(courseId).stream()
                .sorted(Comparator.comparing(Prediction::getGeneratedAt).reversed())
                .forEach(p -> previousRiskByStudentId.putIfAbsent(p.getStudent().getId(), p.getRiskLevel()));

        List<Long> predictableStudentIds = new ArrayList<>();
        List<MlPredictRequest> mlRequests = new ArrayList<>();
        for (Long studentId : studentIds) {
            Student student = studentById.get(studentId);
            Attendance attendance = attendanceByStudentId.get(studentId);
            Assessment assessment = assessmentByStudentId.get(studentId);
            if (student == null || attendance == null || assessment == null) {
                continue;
            }
            double previousGpa = student.getPreviousGpa() != null ? student.getPreviousGpa().doubleValue() : 2.0;
            mlRequests.add(new MlPredictRequest(
                    attendance.getAttendanceRate(),
                    assessment.getCaScore() != null ? assessment.getCaScore().doubleValue() : 0.0,
                    assessment.getAssignmentCompletion() != null ? assessment.getAssignmentCompletion().doubleValue() : 0.0,
                    previousGpa
            ));
            predictableStudentIds.add(studentId);
        }

        List<MlPredictResponse> mlResponses = mlClientService.predictBatch(mlRequests);

        List<Prediction> predictions = new ArrayList<>();
        List<Recommendation> allRecommendations = new ArrayList<>();
        List<Prediction> newlyHighRisk = new ArrayList<>();

        for (int i = 0; i < predictableStudentIds.size(); i++) {
            Long studentId = predictableStudentIds.get(i);
            Student student = studentById.get(studentId);
            Attendance attendance = attendanceByStudentId.get(studentId);
            Assessment assessment = assessmentByStudentId.get(studentId);
            MlPredictResponse mlResponse = mlResponses.get(i);

            Prediction prediction = Prediction.builder()
                    .student(student)
                    .course(course)
                    .semester(semester)
                    .modelUsed(mlResponse.modelUsed())
                    .riskLevel(RiskLevel.valueOf(mlResponse.riskLevel().toUpperCase()))
                    .confidenceScore(BigDecimal.valueOf(mlResponse.confidence() * 100)
                            .setScale(2, RoundingMode.HALF_UP))
                    .build();
            predictions.add(prediction);

            allRecommendations.addAll(recommendationEngine.generate(
                    prediction, attendance.getAttendanceRate(), assessment.getCaScore(),
                    assessment.getAssignmentCompletion()));

            RiskLevel previousRisk = previousRiskByStudentId.get(studentId);
            if (prediction.getRiskLevel() == RiskLevel.HIGH && previousRisk != RiskLevel.HIGH) {
                newlyHighRisk.add(prediction);
            }
        }

        predictions = predictionRepository.saveAll(predictions);
        recommendationRepository.saveAll(allRecommendations);
        newlyHighRisk.forEach(notificationService::notifyHighRisk);

        return predictions;
    }
}
