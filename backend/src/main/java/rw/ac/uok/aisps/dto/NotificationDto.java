package rw.ac.uok.aisps.dto;

import java.time.LocalDateTime;

public record NotificationDto(
        Long id,
        String message,
        boolean read,
        LocalDateTime createdAt
) {
}
