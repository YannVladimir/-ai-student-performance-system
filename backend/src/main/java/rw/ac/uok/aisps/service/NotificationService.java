package rw.ac.uok.aisps.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import rw.ac.uok.aisps.domain.Notification;
import rw.ac.uok.aisps.domain.Prediction;
import rw.ac.uok.aisps.domain.User;
import rw.ac.uok.aisps.dto.NotificationDto;
import rw.ac.uok.aisps.exception.ResourceNotFoundException;
import rw.ac.uok.aisps.repository.NotificationRepository;

import java.util.List;

/**
 * Implements the "Notifications and Alerts" functional requirement
 * (Thesis Section 4.3.1): notify students and lecturers when a student is
 * newly flagged as high risk.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NotificationService {

    private final NotificationRepository notificationRepository;

    @Transactional
    public void notifyHighRisk(Prediction prediction) {
        String courseName = prediction.getCourse() != null ? prediction.getCourse().getCourseName() : "a course";
        User student = prediction.getStudent().getUser();
        String studentMessage = "You have been flagged as high risk in " + courseName
                + ". Review your recommendations and take action soon.";
        notificationRepository.save(Notification.builder()
                .recipient(student)
                .prediction(prediction)
                .message(studentMessage)
                .build());

        if (prediction.getCourse() != null && prediction.getCourse().getLecturer() != null) {
            String lecturerMessage = student.getFullName() + " has been newly flagged as high risk in "
                    + courseName + ".";
            notificationRepository.save(Notification.builder()
                    .recipient(prediction.getCourse().getLecturer())
                    .prediction(prediction)
                    .message(lecturerMessage)
                    .build());
        }
    }

    public List<NotificationDto> listForUser(Long userId) {
        return notificationRepository.findByRecipient_IdOrderByCreatedAtDesc(userId).stream()
                .map(n -> new NotificationDto(n.getId(), n.getMessage(), n.isRead(), n.getCreatedAt()))
                .toList();
    }

    public long unreadCount(Long userId) {
        return notificationRepository.countByRecipient_IdAndReadFalse(userId);
    }

    @Transactional
    public void markRead(Long notificationId, Long userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found: " + notificationId));
        if (!notification.getRecipient().getId().equals(userId)) {
            throw new org.springframework.security.access.AccessDeniedException("Not your notification");
        }
        notification.setRead(true);
        notificationRepository.save(notification);
    }
}
