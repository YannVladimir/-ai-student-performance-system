package rw.ac.uok.aisps.dto;

public record CourseSummaryDto(
        Long courseId,
        String courseCode,
        String courseName,
        Integer credits,
        long enrolledStudents,
        long highRiskCount
) {
}
