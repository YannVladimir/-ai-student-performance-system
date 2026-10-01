package rw.ac.uok.aisps.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * One row of the prediction/recommendation audit trail (Thesis Section 4.3.3,
 * "Transparency and Audit Trail").
 */
public record AuditEntryDto(
        Long predictionId,
        String studentName,
        String registrationNo,
        String courseCode,
        String semester,
        String modelUsed,
        String riskLevel,
        BigDecimal confidenceScore,
        LocalDateTime generatedAt,
        List<String> recommendationMessages
) {
}
