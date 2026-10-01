package rw.ac.uok.aisps.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import rw.ac.uok.aisps.IntegrationTestBase;
import rw.ac.uok.aisps.domain.Course;
import rw.ac.uok.aisps.domain.Role;
import rw.ac.uok.aisps.domain.User;
import rw.ac.uok.aisps.repository.EnrollmentRepository;
import rw.ac.uok.aisps.service.PredictionService;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Recreates Table 11 (Thesis Section 4.7.3): TC-08, plus the PDF/Excel export
 * added in the "Reporting and Analytics" functional requirement (4.3.1).
 */
class AdminControllerTest extends IntegrationTestBase {

    @Autowired
    private EnrollmentRepository enrollmentRepository;

    @Autowired
    private PredictionService predictionService;

    // TC-08: Administrator generates aggregated report -> report reflects correct totals
    @Test
    void analytics_totalsMatchSeededData() throws Exception {
        User admin = anyUserWithRole(Role.ADMIN);
        String token = loginAndGetToken(admin.getEmail(), ADMIN_PASSWORD);

        long expectedStudents = studentRepository.count();
        long expectedCourses = courseRepository.count();

        mockMvc.perform(get("/api/admin/analytics").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalStudents").value(expectedStudents))
                .andExpect(jsonPath("$.totalCourses").value(expectedCourses));
    }

    @Test
    void analyticsReflectsGeneratedPredictions() throws Exception {
        User lecturer = anyUserWithRole(Role.LECTURER);
        Course course = courseRepository.findByLecturer_Id(lecturer.getId()).stream().findFirst().orElseThrow();
        String semester = enrollmentRepository.findByCourse_Id(course.getId()).stream()
                .findFirst().orElseThrow().getSemester();

        predictionService.generateForCourse(course.getId(), semester);

        User admin = anyUserWithRole(Role.ADMIN);
        String token = loginAndGetToken(admin.getEmail(), ADMIN_PASSWORD);

        mockMvc.perform(get("/api/admin/analytics").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.byCourse[?(@.courseCode == '" + course.getCourseCode() + "')]").exists());
    }

    @Test
    void excelReport_downloadsWithCorrectContentType() throws Exception {
        User admin = anyUserWithRole(Role.ADMIN);
        String token = loginAndGetToken(admin.getEmail(), ADMIN_PASSWORD);

        mockMvc.perform(get("/api/admin/reports/excel").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(content().contentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
    }

    @Test
    void pdfReport_downloadsWithCorrectContentType() throws Exception {
        User admin = anyUserWithRole(Role.ADMIN);
        String token = loginAndGetToken(admin.getEmail(), ADMIN_PASSWORD);

        mockMvc.perform(get("/api/admin/reports/pdf").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(content().contentType("application/pdf"));
    }
}
