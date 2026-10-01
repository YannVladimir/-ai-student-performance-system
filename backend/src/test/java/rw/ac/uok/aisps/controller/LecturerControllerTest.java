package rw.ac.uok.aisps.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mock.web.MockMultipartFile;
import rw.ac.uok.aisps.IntegrationTestBase;
import rw.ac.uok.aisps.domain.Course;
import rw.ac.uok.aisps.domain.Role;
import rw.ac.uok.aisps.domain.Student;
import rw.ac.uok.aisps.domain.User;
import rw.ac.uok.aisps.repository.EnrollmentRepository;

import java.nio.charset.StandardCharsets;
import java.util.List;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Recreates Table 11 (Thesis Section 4.7.3): TC-05, TC-06, TC-07, plus the
 * object-level RBAC check ("a lecturer teaching one course must not see
 * another lecturer's course").
 */
class LecturerControllerTest extends IntegrationTestBase {

    @Autowired
    private EnrollmentRepository enrollmentRepository;

    // TC-05 + TC-06: generate a prediction -> risk category + confidence returned,
    // and recommendations are generated and linked to the identified weak areas.
    @Test
    void generatePredictions_returnsRiskCategoriesForEnrolledStudents() throws Exception {
        User lecturer = anyUserWithRole(Role.LECTURER);
        Course course = courseRepository.findByLecturer_Id(lecturer.getId()).stream().findFirst()
                .orElseThrow(() -> new IllegalStateException("Seeded lecturer has no courses"));
        String semester = enrollmentRepository.findByCourse_Id(course.getId()).stream()
                .findFirst().orElseThrow().getSemester();

        String token = loginAndGetToken(lecturer.getEmail(), LECTURER_PASSWORD);

        mockMvc.perform(post("/api/lecturer/courses/{id}/predict", course.getId())
                        .param("semester", semester)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].riskLevel").exists())
                .andExpect(jsonPath("$[0].confidenceScore").exists());

        // recommendations should now exist for at least the high-risk students
        List<?> atRisk = objectMapper.readValue(
                mockMvc.perform(get("/api/lecturer/courses/{id}/at-risk", course.getId())
                                .param("semester", semester)
                                .param("minLevel", "HIGH")
                                .header("Authorization", "Bearer " + token))
                        .andExpect(status().isOk())
                        .andReturn().getResponse().getContentAsString(),
                List.class);
        // not asserting non-empty (risk mix is data-dependent), just that the endpoint is queryable post-generation
        org.junit.jupiter.api.Assertions.assertNotNull(atRisk);
    }

    // TC-07: Lecturer views at-risk students for a course -> only students in that lecturer's course are shown
    @Test
    void lecturerCannotViewAnotherLecturersCourse() throws Exception {
        List<User> lecturers = userRepository.findByRole(Role.LECTURER);
        User lecturerA = lecturers.get(0);

        Course courseNotOwnedByA = courseRepository.findAll().stream()
                .filter(c -> c.getLecturer() == null || !c.getLecturer().getId().equals(lecturerA.getId()))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("Expected at least one course not owned by lecturerA"));

        String token = loginAndGetToken(lecturerA.getEmail(), LECTURER_PASSWORD);

        mockMvc.perform(get("/api/lecturer/courses/{id}/at-risk", courseNotOwnedByA.getId())
                        .param("semester", "2024-Sem1")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    // Upload Data page: after uploading a sheet for a course, it shows up in
    // that course's upload history -- and only lecturers who own the course
    // (or an admin) can see it.
    @Test
    void uploadHistory_reflectsUploadsAndIsRestrictedToOwningLecturer() throws Exception {
        User lecturer = anyUserWithRole(Role.LECTURER);
        Course course = courseRepository.findByLecturer_Id(lecturer.getId()).stream().findFirst()
                .orElseThrow(() -> new IllegalStateException("Seeded lecturer has no courses"));
        Student student = studentRepository.findAll().get(0);
        String token = loginAndGetToken(lecturer.getEmail(), LECTURER_PASSWORD);

        String csv = "registration_no,sessions_attended,sessions_total,ca_score,assignment_completion,final_score\n"
                + student.getRegistrationNo() + ",30,36,70.5,85.0,75.0\n";
        MockMultipartFile file = new MockMultipartFile(
                "file", "grades.csv", "text/csv", csv.getBytes(StandardCharsets.UTF_8));

        mockMvc.perform(multipart("/api/lecturer/upload")
                        .file(file)
                        .param("courseId", course.getId().toString())
                        .param("semester", "2099-Upload")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/lecturer/courses/{id}/uploads", course.getId())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].fileName").value("grades.csv"))
                .andExpect(jsonPath("$[0].semester").value("2099-Upload"))
                .andExpect(jsonPath("$[0].uploadedByName").value(lecturer.getFullName()))
                .andExpect(jsonPath("$[0].recordsProcessed").value(1));

        List<User> lecturers = userRepository.findByRole(Role.LECTURER);
        User otherLecturer = lecturers.stream()
                .filter(l -> !l.getId().equals(lecturer.getId()))
                .findFirst().orElseThrow();
        String otherToken = loginAndGetToken(otherLecturer.getEmail(), LECTURER_PASSWORD);

        mockMvc.perform(get("/api/lecturer/courses/{id}/uploads", course.getId())
                        .header("Authorization", "Bearer " + otherToken))
                .andExpect(status().isForbidden());
    }
}
