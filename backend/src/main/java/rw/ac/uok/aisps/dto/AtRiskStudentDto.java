package rw.ac.uok.aisps.dto;

import java.math.BigDecimal;

public record AtRiskStudentDto(
        Long studentId,
        String fullName,
        String registrationNo,
        String courseCode,
        String semester,
        String riskLevel,
        BigDecimal confidenceScore,
        Double attendanceRate,
        BigDecimal caScore,
        BigDecimal assignmentCompletion
) {
}
