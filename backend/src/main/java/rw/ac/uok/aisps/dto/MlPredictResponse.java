package rw.ac.uok.aisps.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record MlPredictResponse(
        @JsonProperty("risk_level") String riskLevel,
        @JsonProperty("confidence") double confidence,
        @JsonProperty("model_used") String modelUsed
) {
}
