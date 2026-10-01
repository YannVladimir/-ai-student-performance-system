package rw.ac.uok.aisps.service;

import lombok.RequiredArgsConstructor;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import rw.ac.uok.aisps.domain.*;
import rw.ac.uok.aisps.dto.UploadHistoryDto;
import rw.ac.uok.aisps.dto.UploadResultDto;
import rw.ac.uok.aisps.exception.ResourceNotFoundException;
import rw.ac.uok.aisps.repository.*;

import java.io.IOException;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * Ingests the lecturer/admin academic-data upload described in Section 4.3.1.
 * The course and semester are chosen up front by the caller (a dropdown on
 * the Upload Data page) rather than typed into the CSV, so course-ownership
 * is checked once by the controller before this runs -- not per row.
 *
 * Expected CSV header:
 * registration_no,sessions_attended,sessions_total,ca_score,assignment_completion,final_score
 * (final_score is optional -- may be blank before end-of-semester exams are marked)
 */
@Service
@RequiredArgsConstructor
public class DataUploadService {

    /**
     * Matches a registration_no that spreadsheet software (Excel/Google
     * Sheets) has corrupted into scientific notation, e.g. "2.20294E+12".
     * This is NOT reversible: the display/export only keeps ~6 significant
     * digits, so a 13-digit registration_no loses the information needed to
     * recover it exactly (a 6-sig-fig bucket typically matches dozens of
     * real registration numbers, not one) -- silently guessing one back
     * risks attributing academic data to the wrong student, so we detect
     * and explain the problem instead of attempting to "fix" it.
     */
    private static final Pattern SCIENTIFIC_NOTATION = Pattern.compile("^\\d+\\.?\\d*E[+-]?\\d+$",
            Pattern.CASE_INSENSITIVE);

    private final StudentRepository studentRepository;
    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final AttendanceRepository attendanceRepository;
    private final AssessmentRepository assessmentRepository;
    private final DataUploadRepository dataUploadRepository;
    private final UserRepository userRepository;

    @Transactional
    public UploadResultDto processAcademicDataCsv(MultipartFile file, Long courseId, String semester,
                                                    Long uploaderUserId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found: " + courseId));

        List<CSVRecord> records;
        try (CSVParser parser = CSVParser.parse(
                new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8),
                CSVFormat.DEFAULT.builder().setHeader().setSkipHeaderRecord(true).setTrim(true).build())) {
            records = parser.getRecords();
        } catch (IOException e) {
            throw new IllegalStateException("Unable to read uploaded file: " + e.getMessage(), e);
        }

        // Bulk-load everything up front instead of querying per row -- for a
        // file with N rows this turns ~5N sequential round-trips into a
        // handful of queries plus a handful of bulk saves, which is what
        // keeps a few-thousand-row upload from taking minutes.
        Set<String> regNos = records.stream()
                .filter(r -> r.isMapped("registration_no"))
                .map(r -> r.get("registration_no").trim())
                .filter(s -> !s.isBlank())
                .collect(Collectors.toSet());
        Map<String, Student> studentsByRegNo = studentRepository.findByRegistrationNoIn(regNos).stream()
                .collect(Collectors.toMap(Student::getRegistrationNo, s -> s));

        Map<Long, Enrollment> enrollmentByStudentId = enrollmentRepository
                .findByCourse_IdAndSemester(courseId, semester).stream()
                .collect(Collectors.toMap(e -> e.getStudent().getId(), e -> e));
        Map<Long, Attendance> attendanceByStudentId = attendanceRepository
                .findByCourse_IdAndSemester(courseId, semester).stream()
                .collect(Collectors.toMap(a -> a.getStudent().getId(), a -> a));
        Map<Long, Assessment> assessmentByStudentId = assessmentRepository
                .findByCourse_IdAndSemester(courseId, semester).stream()
                .collect(Collectors.toMap(a -> a.getStudent().getId(), a -> a));

        List<Enrollment> newEnrollments = new ArrayList<>();
        List<Attendance> attendanceToSave = new ArrayList<>();
        List<Assessment> assessmentToSave = new ArrayList<>();
        Set<Long> enrolledStudentIds = new HashSet<>(); // dedupe within this same upload

        int processed = 0;
        List<String> errors = new ArrayList<>();
        long rowNum = 1;
        for (CSVRecord record : records) {
            rowNum++;
            try {
                processRow(record, course, semester, studentsByRegNo, enrollmentByStudentId,
                        attendanceByStudentId, assessmentByStudentId, newEnrollments, attendanceToSave,
                        assessmentToSave, enrolledStudentIds);
                processed++;
            } catch (Exception rowEx) {
                errors.add("Row " + rowNum + ": " + rowEx.getMessage());
            }
        }

        enrollmentRepository.saveAll(newEnrollments);
        attendanceRepository.saveAll(attendanceToSave);
        assessmentRepository.saveAll(assessmentToSave);

        User uploader = userRepository.findById(uploaderUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + uploaderUserId));
        dataUploadRepository.save(DataUpload.builder()
                .course(course)
                .uploadedBy(uploader)
                .semester(semester)
                .fileName(file.getOriginalFilename() != null ? file.getOriginalFilename() : "upload.csv")
                .recordsProcessed(processed)
                .recordsFailed(errors.size())
                .build());

        return new UploadResultDto(processed, errors.size(), errors);
    }

    @Transactional(readOnly = true)
    public List<UploadHistoryDto> getUploadHistory(Long courseId) {
        return dataUploadRepository.findByCourse_IdOrderByUploadedAtDesc(courseId).stream()
                .map(u -> new UploadHistoryDto(
                        u.getId(),
                        u.getFileName(),
                        u.getSemester(),
                        u.getUploadedAt(),
                        u.getUploadedBy().getFullName(),
                        u.getRecordsProcessed(),
                        u.getRecordsFailed()))
                .toList();
    }

    private void processRow(CSVRecord record, Course course, String semester,
                             Map<String, Student> studentsByRegNo,
                             Map<Long, Enrollment> enrollmentByStudentId,
                             Map<Long, Attendance> attendanceByStudentId,
                             Map<Long, Assessment> assessmentByStudentId,
                             List<Enrollment> newEnrollments,
                             List<Attendance> attendanceToSave,
                             List<Assessment> assessmentToSave,
                             Set<Long> enrolledStudentIds) {
        String regNo = require(record, "registration_no");

        Student student = studentsByRegNo.get(regNo);
        if (student == null) {
            if (SCIENTIFIC_NOTATION.matcher(regNo).matches()) {
                throw new IllegalArgumentException("registration_no '" + regNo + "' looks like it was corrupted "
                        + "by spreadsheet software (Excel/Google Sheets) converting it to scientific notation, "
                        + "which discards digits and cannot be safely reversed. Please re-export or re-enter this "
                        + "column as Text and re-upload the file.");
            }
            throw new IllegalArgumentException("Unknown registration_no: " + regNo);
        }
        Long studentId = student.getId();

        if (!enrollmentByStudentId.containsKey(studentId) && enrolledStudentIds.add(studentId)) {
            newEnrollments.add(Enrollment.builder().student(student).course(course).semester(semester).build());
        }

        int sessionsAttended = requireInt(record, "sessions_attended");
        int sessionsTotal = requireInt(record, "sessions_total");
        if (sessionsTotal <= 0) {
            throw new IllegalArgumentException("sessions_total must be greater than zero");
        }
        if (sessionsAttended > sessionsTotal) {
            throw new IllegalArgumentException("sessions_attended cannot exceed sessions_total");
        }

        Attendance attendance = attendanceByStudentId.get(studentId);
        if (attendance == null) {
            attendance = Attendance.builder().student(student).course(course).semester(semester).build();
        }
        attendance.setSessionsAttended(sessionsAttended);
        attendance.setSessionsTotal(sessionsTotal);
        attendanceToSave.add(attendance);

        BigDecimal caScore = requireDecimal(record, "ca_score");
        BigDecimal assignmentCompletion = requireDecimal(record, "assignment_completion");
        BigDecimal finalScore = optionalDecimal(record, "final_score");

        Assessment assessment = assessmentByStudentId.get(studentId);
        if (assessment == null) {
            assessment = Assessment.builder().student(student).course(course).semester(semester).build();
        }
        assessment.setCaScore(caScore);
        assessment.setAssignmentCompletion(assignmentCompletion);
        assessment.setFinalScore(finalScore);
        assessmentToSave.add(assessment);
    }

    private String require(CSVRecord record, String column) {
        String value = record.isMapped(column) ? record.get(column) : null;
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("Missing required field: " + column);
        }
        return value.trim();
    }

    private int requireInt(CSVRecord record, String column) {
        try {
            return Integer.parseInt(require(record, column));
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException(column + " must be a whole number");
        }
    }

    private BigDecimal requireDecimal(CSVRecord record, String column) {
        try {
            return new BigDecimal(require(record, column));
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException(column + " must be a number");
        }
    }

    private BigDecimal optionalDecimal(CSVRecord record, String column) {
        if (!record.isMapped(column)) return null;
        String value = record.get(column);
        if (value == null || value.isBlank()) return null;
        try {
            return new BigDecimal(value.trim());
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException(column + " must be a number");
        }
    }
}
