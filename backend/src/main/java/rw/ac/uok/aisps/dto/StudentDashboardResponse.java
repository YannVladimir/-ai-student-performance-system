package rw.ac.uok.aisps.dto;

import java.util.List;

public record StudentDashboardResponse(
        Long studentId,
        String fullName,
        String registrationNo,
        String program,
        Integer yearOfStudy,
        String overallRiskLevel,
        List<CoursePredictionDto> coursePredictions
) {
}
