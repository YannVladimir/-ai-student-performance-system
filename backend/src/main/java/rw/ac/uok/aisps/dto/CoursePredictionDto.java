package rw.ac.uok.aisps.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record CoursePredictionDto(
        Long courseId,
        String courseCode,
        String courseName,
        String semester,
        String riskLevel,
        BigDecimal confidenceScore,
        String modelUsed,
        LocalDateTime generatedAt,
        List<RecommendationDto> recommendations,
        Double attendanceRate,
        BigDecimal caScore,
        BigDecimal assignmentCompletion,
        BigDecimal finalScore
) {
}
