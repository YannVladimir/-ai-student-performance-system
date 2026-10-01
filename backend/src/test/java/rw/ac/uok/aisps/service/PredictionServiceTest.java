package rw.ac.uok.aisps.service;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import rw.ac.uok.aisps.IntegrationTestBase;
import rw.ac.uok.aisps.domain.*;
import rw.ac.uok.aisps.repository.*;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

class PredictionServiceTest extends IntegrationTestBase {

    @Autowired
    private PredictionService predictionService;
    @Autowired
    private AttendanceRepository attendanceRepository;
    @Autowired
    private AssessmentRepository assessmentRepository;
    @Autowired
    private EnrollmentRepository enrollmentRepository;
    @Autowired
    private RecommendationRepository recommendationRepository;
    @Autowired
    private NotificationRepository notificationRepository;

    // TC-05 + TC-06 at the service layer: prediction has a valid risk category and
    // confidence score, and weak-feature-driven recommendations are generated.
    @Test
    void generateForStudentCourse_producesHighRiskPredictionWithRecommendationsAndNotification() {
        Student student = studentRepository.findAll().get(0);
        Course course = courseRepository.findAll().get(0);
        String semester = "2099-PredictionTest";

        enrollmentRepository.save(Enrollment.builder().student(student).course(course).semester(semester).build());
        attendanceRepository.save(Attendance.builder().student(student).course(course).semester(semester)
                .sessionsAttended(10).sessionsTotal(40).build()); // 25% attendance -> should be flagged
        assessmentRepository.save(Assessment.builder().student(student).course(course).semester(semester)
                .caScore(new BigDecimal("20.0")).assignmentCompletion(new BigDecimal("15.0"))
                .finalScore(new BigDecimal("18.0")).build());

        long notificationsBefore = notificationRepository.count();

        Prediction prediction = predictionService.generateForStudentCourse(student.getId(), course.getId(), semester);

        assertNotNull(prediction.getRiskLevel());
        assertNotNull(prediction.getConfidenceScore());
        assertEquals(RiskLevel.HIGH, prediction.getRiskLevel(), "Very low attendance/CA/assignments should be HIGH risk");

        var recommendations = recommendationRepository.findByPrediction_Id(prediction.getId());
        assertFalse(recommendations.isEmpty(), "A high-risk prediction should generate at least one recommendation");

        long notificationsAfter = notificationRepository.count();
        assertTrue(notificationsAfter > notificationsBefore,
                "A newly high-risk prediction should trigger at least one notification");
    }
}
