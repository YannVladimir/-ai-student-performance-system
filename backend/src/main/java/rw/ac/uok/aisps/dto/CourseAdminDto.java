package rw.ac.uok.aisps.dto;

public record CourseAdminDto(
        Long id,
        String courseCode,
        String courseName,
        Integer credits,
        String program,
        Long lecturerId,
        String lecturerName
) {
}
