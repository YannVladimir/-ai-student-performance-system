package rw.ac.uok.aisps.dto;

public record StudentOverviewDto(
        Long studentId,
        String fullName,
        String registrationNo,
        String program,
        Integer yearOfStudy,
        String overallRiskLevel,
        int enrolledCourses
) {
}
