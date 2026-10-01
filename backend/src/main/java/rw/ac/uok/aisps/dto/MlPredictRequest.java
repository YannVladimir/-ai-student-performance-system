package rw.ac.uok.aisps.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record MlPredictRequest(
        @JsonProperty("attendance_rate") double attendanceRate,
        @JsonProperty("ca_score") double caScore,
        @JsonProperty("assignment_completion") double assignmentCompletion,
        @JsonProperty("previous_gpa") double previousGpa
) {
}
