package rw.ac.uok.aisps.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import rw.ac.uok.aisps.dto.NotificationDto;
import rw.ac.uok.aisps.security.UserPrincipal;
import rw.ac.uok.aisps.service.NotificationService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public List<NotificationDto> list(@AuthenticationPrincipal UserPrincipal principal) {
        return notificationService.listForUser(principal.getId());
    }

    @GetMapping("/unread-count")
    public Map<String, Long> unreadCount(@AuthenticationPrincipal UserPrincipal principal) {
        return Map.of("count", notificationService.unreadCount(principal.getId()));
    }

    @PatchMapping("/{id}/read")
    public void markRead(@AuthenticationPrincipal UserPrincipal principal, @PathVariable Long id) {
        notificationService.markRead(id, principal.getId());
    }
}
