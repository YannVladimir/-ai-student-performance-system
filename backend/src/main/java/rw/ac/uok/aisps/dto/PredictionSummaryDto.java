package rw.ac.uok.aisps.dto;

import java.math.BigDecimal;

public record PredictionSummaryDto(
        Long studentId,
        String riskLevel,
        BigDecimal confidenceScore
) {
}
