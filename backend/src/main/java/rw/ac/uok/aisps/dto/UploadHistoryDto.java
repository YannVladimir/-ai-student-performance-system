package rw.ac.uok.aisps.dto;

import java.time.LocalDateTime;

public record UploadHistoryDto(
        Long id,
        String fileName,
        String semester,
        LocalDateTime uploadedAt,
        String uploadedByName,
        int recordsProcessed,
        int recordsFailed
) {
}
