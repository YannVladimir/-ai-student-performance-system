package rw.ac.uok.aisps.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import rw.ac.uok.aisps.domain.Prediction;
import rw.ac.uok.aisps.dto.AuditEntryDto;
import rw.ac.uok.aisps.repository.PredictionRepository;
import rw.ac.uok.aisps.repository.RecommendationRepository;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuditService {

    private static final int MAX_ENTRIES = 200;

    private final PredictionRepository predictionRepository;
    private final RecommendationRepository recommendationRepository;

    public List<AuditEntryDto> recentEntries(Long studentId, Long courseId) {
        return predictionRepository.findAllByOrderByGeneratedAtDesc().stream()
                .filter(p -> studentId == null || p.getStudent().getId().equals(studentId))
                .filter(p -> courseId == null || (p.getCourse() != null && p.getCourse().getId().equals(courseId)))
                .limit(MAX_ENTRIES)
                .map(this::toDto)
                .toList();
    }

    private AuditEntryDto toDto(Prediction p) {
        List<String> messages = recommendationRepository.findByPrediction_Id(p.getId()).stream()
                .map(r -> r.getMessage())
                .toList();
        return new AuditEntryDto(
                p.getId(),
                p.getStudent().getUser().getFullName(),
                p.getStudent().getRegistrationNo(),
                p.getCourse() != null ? p.getCourse().getCourseCode() : null,
                p.getSemester(),
                p.getModelUsed(),
                p.getRiskLevel().name(),
                p.getConfidenceScore(),
                p.getGeneratedAt(),
                messages);
    }
}
