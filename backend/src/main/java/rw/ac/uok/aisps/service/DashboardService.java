package rw.ac.uok.aisps.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import rw.ac.uok.aisps.domain.*;
import rw.ac.uok.aisps.dto.*;
import rw.ac.uok.aisps.exception.ResourceNotFoundException;
import rw.ac.uok.aisps.repository.*;

import java.util.*;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardService {

    private final StudentRepository studentRepository;
    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final AttendanceRepository attendanceRepository;
    private final AssessmentRepository assessmentRepository;
    private final PredictionRepository predictionRepository;
    private final RecommendationRepository recommendationRepository;

    public StudentDashboardResponse studentDashboard(Long studentId) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found: " + studentId));

        List<Enrollment> enrollments = enrollmentRepository.findByStudent_Id(studentId);

        List<CoursePredictionDto> coursePredictions = enrollments.stream()
                .map(e -> {
                    var attendance = attendanceRepository
                            .findByStudent_IdAndCourse_IdAndSemester(studentId, e.getCourse().getId(), e.getSemester());
                    var assessment = assessmentRepository
                            .findByStudent_IdAndCourse_IdAndSemester(studentId, e.getCourse().getId(), e.getSemester());
                    Double attendanceRate = attendance.map(Attendance::getAttendanceRate).orElse(null);
                    var caScore = assessment.map(Assessment::getCaScore).orElse(null);
                    var assignmentCompletion = assessment.map(Assessment::getAssignmentCompletion).orElse(null);
                    var finalScore = assessment.map(Assessment::getFinalScore).orElse(null);

                    return predictionRepository
                            .findTopByStudent_IdAndCourse_IdOrderByGeneratedAtDesc(studentId, e.getCourse().getId())
                            .map(p -> toCoursePredictionDto(e.getCourse(), e.getSemester(), p,
                                    attendanceRate, caScore, assignmentCompletion, finalScore))
                            .orElseGet(() -> new CoursePredictionDto(
                                    e.getCourse().getId(), e.getCourse().getCourseCode(), e.getCourse().getCourseName(),
                                    e.getSemester(), "NOT_YET_PREDICTED", null, null, null, List.of(),
                                    attendanceRate, caScore, assignmentCompletion, finalScore));
                })
                .toList();

        String overallRisk = worstRisk(coursePredictions);

        return new StudentDashboardResponse(
                student.getId(), student.getUser().getFullName(), student.getRegistrationNo(),
                student.getProgram(), student.getYearOfStudy(), overallRisk, coursePredictions);
    }

    public List<AtRiskStudentDto> atRiskStudentsForCourse(Long courseId, String semester, RiskLevel minLevel) {
        List<Prediction> predictions = predictionRepository.findByCourse_IdAndSemester(courseId, semester);

        return predictions.stream()
                .filter(p -> minLevel == null || severity(p.getRiskLevel()) >= severity(minLevel))
                .map(p -> {
                    Student s = p.getStudent();
                    var attendance = attendanceRepository
                            .findByStudent_IdAndCourse_IdAndSemester(s.getId(), courseId, semester);
                    var assessment = assessmentRepository
                            .findByStudent_IdAndCourse_IdAndSemester(s.getId(), courseId, semester);
                    return new AtRiskStudentDto(
                            s.getId(), s.getUser().getFullName(), s.getRegistrationNo(),
                            p.getCourse().getCourseCode(), semester, p.getRiskLevel().name(),
                            p.getConfidenceScore(),
                            attendance.map(Attendance::getAttendanceRate).orElse(null),
                            assessment.map(Assessment::getCaScore).orElse(null),
                            assessment.map(Assessment::getAssignmentCompletion).orElse(null));
                })
                .sorted(Comparator.comparingInt((AtRiskStudentDto d) -> severity(RiskLevel.valueOf(d.riskLevel()))).reversed())
                .toList();
    }

    public AdminAnalyticsResponse adminAnalytics() {
        List<Prediction> latestPerStudentCourse = latestPredictionsOnly();

        Map<String, Long> riskDistribution = new LinkedHashMap<>();
        riskDistribution.put("LOW", count(latestPerStudentCourse, RiskLevel.LOW));
        riskDistribution.put("MEDIUM", count(latestPerStudentCourse, RiskLevel.MEDIUM));
        riskDistribution.put("HIGH", count(latestPerStudentCourse, RiskLevel.HIGH));

        Map<String, long[]> byProgramMap = new LinkedHashMap<>();
        for (Prediction p : latestPerStudentCourse) {
            String program = p.getStudent().getProgram();
            byProgramMap.computeIfAbsent(program, k -> new long[3])[severity(p.getRiskLevel())]++;
        }
        List<AdminAnalyticsResponse.ProgramRiskSummary> byProgram = byProgramMap.entrySet().stream()
                .map(en -> new AdminAnalyticsResponse.ProgramRiskSummary(
                        en.getKey(), en.getValue()[0], en.getValue()[1], en.getValue()[2]))
                .toList();

        Map<Course, long[]> byCourseMap = new LinkedHashMap<>();
        for (Prediction p : latestPerStudentCourse) {
            if (p.getCourse() == null) continue;
            byCourseMap.computeIfAbsent(p.getCourse(), k -> new long[3])[severity(p.getRiskLevel())]++;
        }
        List<AdminAnalyticsResponse.CourseRiskSummary> byCourse = byCourseMap.entrySet().stream()
                .map(en -> new AdminAnalyticsResponse.CourseRiskSummary(
                        en.getKey().getCourseCode(), en.getKey().getCourseName(),
                        en.getValue()[0], en.getValue()[1], en.getValue()[2]))
                .toList();

        return new AdminAnalyticsResponse(
                studentRepository.count(), courseRepository.count(), riskDistribution, byProgram, byCourse);
    }

    /** Institution-wide "student welfare" view for University Management: latest prediction
     * per (student, course), optionally scoped to one semester and a minimum risk level. */
    public List<AtRiskStudentDto> atRiskInstitutionWide(String semester, RiskLevel minLevel) {
        List<Prediction> filtered = predictionRepository.findAllByOrderByGeneratedAtDesc().stream()
                .filter(p -> semester == null || semester.equals(p.getSemester()))
                .toList();

        Map<String, Prediction> latest = new LinkedHashMap<>();
        for (Prediction p : filtered) {
            String key = p.getStudent().getId() + ":" + (p.getCourse() != null ? p.getCourse().getId() : "none");
            latest.putIfAbsent(key, p);
        }

        return latest.values().stream()
                .filter(p -> minLevel == null || severity(p.getRiskLevel()) >= severity(minLevel))
                .map(p -> {
                    Student s = p.getStudent();
                    Long courseId = p.getCourse() != null ? p.getCourse().getId() : null;
                    Optional<Attendance> attendance = courseId != null
                            ? attendanceRepository.findByStudent_IdAndCourse_IdAndSemester(s.getId(), courseId, p.getSemester())
                            : Optional.empty();
                    Optional<Assessment> assessment = courseId != null
                            ? assessmentRepository.findByStudent_IdAndCourse_IdAndSemester(s.getId(), courseId, p.getSemester())
                            : Optional.empty();
                    return new AtRiskStudentDto(
                            s.getId(), s.getUser().getFullName(), s.getRegistrationNo(),
                            p.getCourse() != null ? p.getCourse().getCourseCode() : null, p.getSemester(),
                            p.getRiskLevel().name(), p.getConfidenceScore(),
                            attendance.map(Attendance::getAttendanceRate).orElse(null),
                            assessment.map(Assessment::getCaScore).orElse(null),
                            assessment.map(Assessment::getAssignmentCompletion).orElse(null));
                })
                .sorted(Comparator.comparingInt((AtRiskStudentDto d) -> severity(RiskLevel.valueOf(d.riskLevel()))).reversed())
                .toList();
    }

    /** Risk distribution per semester (latest prediction per student/course/semester triple),
     * scoped to one course for a lecturer, or institution-wide when courseId is null for Management. */
    public List<TrendPointDto> riskTrendBySemester(Long courseId) {
        List<Prediction> source = courseId != null
                ? predictionRepository.findByCourse_Id(courseId)
                : predictionRepository.findAll();

        List<Prediction> sorted = new ArrayList<>(source);
        sorted.sort(Comparator.comparing(Prediction::getGeneratedAt).reversed());

        Map<String, Prediction> latest = new LinkedHashMap<>();
        for (Prediction p : sorted) {
            String key = p.getStudent().getId() + ":" + (p.getCourse() != null ? p.getCourse().getId() : "none")
                    + ":" + p.getSemester();
            latest.putIfAbsent(key, p);
        }

        Map<String, long[]> bySemester = new TreeMap<>();
        for (Prediction p : latest.values()) {
            bySemester.computeIfAbsent(p.getSemester(), k -> new long[3])[severity(p.getRiskLevel())]++;
        }

        return bySemester.entrySet().stream()
                .map(en -> new TrendPointDto(en.getKey(), en.getValue()[0], en.getValue()[1], en.getValue()[2]))
                .toList();
    }

    /** Institution-wide "overall performance" view for University Management: every
     * student's worst risk level across their courses, plus how many courses they take. */
    public List<StudentOverviewDto> studentOverviewInstitutionWide() {
        Map<Long, Integer> enrollmentCountByStudent = new LinkedHashMap<>();
        for (Enrollment e : enrollmentRepository.findAll()) {
            enrollmentCountByStudent.merge(e.getStudent().getId(), 1, Integer::sum);
        }

        Map<Long, RiskLevel> worstRiskByStudent = new LinkedHashMap<>();
        for (Prediction p : latestPredictionsOnly()) {
            Long studentId = p.getStudent().getId();
            RiskLevel current = worstRiskByStudent.get(studentId);
            if (current == null || severity(p.getRiskLevel()) > severity(current)) {
                worstRiskByStudent.put(studentId, p.getRiskLevel());
            }
        }

        return studentRepository.findAll().stream()
                .map(s -> new StudentOverviewDto(
                        s.getId(), s.getUser().getFullName(), s.getRegistrationNo(), s.getProgram(),
                        s.getYearOfStudy(),
                        worstRiskByStudent.containsKey(s.getId()) ? worstRiskByStudent.get(s.getId()).name() : "NOT_YET_PREDICTED",
                        enrollmentCountByStudent.getOrDefault(s.getId(), 0)))
                .toList();
    }

    public List<CourseSummaryDto> lecturerCourses(Long lecturerUserId) {
        return courseRepository.findByLecturer_Id(lecturerUserId).stream()
                .map(c -> {
                    long enrolled = enrollmentRepository.findByCourse_Id(c.getId()).size();
                    long highRisk = predictionRepository.findByCourse_IdAndSemester(c.getId(), currentSemesterGuess())
                            .stream().filter(p -> p.getRiskLevel() == RiskLevel.HIGH).count();
                    return new CourseSummaryDto(c.getId(), c.getCourseCode(), c.getCourseName(), c.getCredits(), enrolled, highRisk);
                })
                .toList();
    }

    private List<Prediction> latestPredictionsOnly() {
        Map<String, Prediction> latest = new LinkedHashMap<>();
        for (Prediction p : predictionRepository.findAllByOrderByGeneratedAtDesc()) {
            String key = p.getStudent().getId() + ":" + (p.getCourse() != null ? p.getCourse().getId() : "none");
            latest.putIfAbsent(key, p);
        }
        return new ArrayList<>(latest.values());
    }

    private long count(List<Prediction> predictions, RiskLevel level) {
        return predictions.stream().filter(p -> p.getRiskLevel() == level).count();
    }

    private int severity(RiskLevel level) {
        return switch (level) {
            case LOW -> 0;
            case MEDIUM -> 1;
            case HIGH -> 2;
        };
    }

    private String worstRisk(List<CoursePredictionDto> predictions) {
        return predictions.stream()
                .map(CoursePredictionDto::riskLevel)
                .filter(r -> !"NOT_YET_PREDICTED".equals(r))
                .max(Comparator.comparingInt(r -> severity(RiskLevel.valueOf(r))))
                .orElse("NOT_YET_PREDICTED");
    }

    private CoursePredictionDto toCoursePredictionDto(Course course, String semester, Prediction p,
                                                        Double attendanceRate, java.math.BigDecimal caScore,
                                                        java.math.BigDecimal assignmentCompletion,
                                                        java.math.BigDecimal finalScore) {
        List<RecommendationDto> recs = recommendationRepository.findByPrediction_Id(p.getId()).stream()
                .map(r -> new RecommendationDto(r.getId(), r.getCategory(), r.getMessage(), r.getStatus().name()))
                .toList();
        return new CoursePredictionDto(
                course.getId(), course.getCourseCode(), course.getCourseName(), semester,
                p.getRiskLevel().name(), p.getConfidenceScore(), p.getModelUsed(), p.getGeneratedAt(), recs,
                attendanceRate, caScore, assignmentCompletion, finalScore);
    }

    private String currentSemesterGuess() {
        // Placeholder until an explicit "active semester" admin setting exists (Phase 5).
        return "2025-Sem1";
    }
}
