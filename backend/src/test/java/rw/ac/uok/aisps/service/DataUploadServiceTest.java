package rw.ac.uok.aisps.service;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mock.web.MockMultipartFile;
import rw.ac.uok.aisps.IntegrationTestBase;
import rw.ac.uok.aisps.domain.Course;
import rw.ac.uok.aisps.domain.Role;
import rw.ac.uok.aisps.domain.Student;
import rw.ac.uok.aisps.dto.UploadResultDto;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.stream.IntStream;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Recreates Table 11 (Thesis Section 4.7.3): TC-03, TC-04, TC-09. The course
 * and semester are chosen up front (like the Upload Data page's dropdown),
 * matching how LecturerController now calls this service.
 */
class DataUploadServiceTest extends IntegrationTestBase {

    @Autowired
    private DataUploadService dataUploadService;

    // TC-03: Lecturer uploads academic data file -> data validated and stored correctly
    @Test
    void validUpload_isProcessedAndStored() {
        Student student = studentRepository.findAll().get(0);
        Course course = courseRepository.findAll().get(0);

        String csv = "registration_no,sessions_attended,sessions_total,ca_score,assignment_completion,final_score\n"
                + student.getRegistrationNo() + ",30,36,70.5,85.0,75.0\n";

        UploadResultDto result = dataUploadService.processAcademicDataCsv(
                new MockMultipartFile("file", "upload.csv", "text/csv", csv.getBytes(StandardCharsets.UTF_8)),
                course.getId(), "2099-TestSem", anyUserWithRole(Role.LECTURER).getId());

        assertEquals(1, result.recordsProcessed());
        assertEquals(0, result.recordsFailed());
    }

    // TC-04: Upload file with missing values -> system flags/handles missing values without crashing
    @Test
    void uploadWithMissingValues_failsThatRowButProcessesOthers() {
        List<Student> students = studentRepository.findAll();
        Course course = courseRepository.findAll().get(0);

        String csv = "registration_no,sessions_attended,sessions_total,ca_score,assignment_completion,final_score\n"
                // row 1: valid
                + students.get(0).getRegistrationNo() + ",30,36,70.5,85.0,75.0\n"
                // row 2: missing ca_score
                + students.get(1).getRegistrationNo() + ",30,36,,85.0,75.0\n";

        UploadResultDto result = dataUploadService.processAcademicDataCsv(
                new MockMultipartFile("file", "upload.csv", "text/csv", csv.getBytes(StandardCharsets.UTF_8)),
                course.getId(), "2099-TestSem", anyUserWithRole(Role.LECTURER).getId());

        assertEquals(1, result.recordsProcessed());
        assertEquals(1, result.recordsFailed());
        assertFalse(result.errors().isEmpty());
    }

    // TC-09: Concurrent data upload by multiple lecturers -> system processes all uploads without errors
    @Test
    void concurrentUploads_allSucceedWithoutErrors() throws Exception {
        List<Student> students = studentRepository.findAll();
        Course course = courseRepository.findAll().get(0);
        Long lecturerId = anyUserWithRole(Role.LECTURER).getId();

        ExecutorService pool = Executors.newFixedThreadPool(8);
        try {
            List<Future<UploadResultDto>> futures = IntStream.range(0, 20)
                    .<Future<UploadResultDto>>mapToObj(i -> pool.submit(() -> {
                        Student student = students.get(i % students.size());
                        String csv = "registration_no,sessions_attended,sessions_total,ca_score,assignment_completion,final_score\n"
                                + student.getRegistrationNo() + ",30,36,70.0,80.0,72.0\n";
                        return dataUploadService.processAcademicDataCsv(new MockMultipartFile(
                                "file", "upload.csv", "text/csv", csv.getBytes(StandardCharsets.UTF_8)),
                                course.getId(), "2099-Concurrent" + i, lecturerId);
                    }))
                    .toList();

            for (Future<UploadResultDto> f : futures) {
                UploadResultDto result = f.get(30, TimeUnit.SECONDS);
                assertEquals(1, result.recordsProcessed());
                assertEquals(0, result.recordsFailed());
            }
        } finally {
            pool.shutdown();
        }
    }
}
