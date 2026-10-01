package rw.ac.uok.aisps.dto;

public record RecommendationDto(
        Long id,
        String category,
        String message,
        String status
) {
}
