package rw.ac.uok.aisps.dto;

public record CreateCourseRequest(
        String courseCode,
        String courseName,
        Integer credits,
        String program,
        Long lecturerUserId
) {
}
