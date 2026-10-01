package rw.ac.uok.aisps.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import rw.ac.uok.aisps.domain.Notification;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByRecipient_IdOrderByCreatedAtDesc(Long recipientId);
    long countByRecipient_IdAndReadFalse(Long recipientId);
}
