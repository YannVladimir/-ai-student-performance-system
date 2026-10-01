package rw.ac.uok.aisps.dto;

public record UpdateCourseRequest(
        String courseName,
        Integer credits,
        String program,
        Long lecturerUserId
) {
}
