package rw.ac.uok.aisps.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import rw.ac.uok.aisps.domain.Recommendation;
import rw.ac.uok.aisps.domain.RecommendationStatus;
import rw.ac.uok.aisps.dto.StudentDashboardResponse;
import rw.ac.uok.aisps.exception.ResourceNotFoundException;
import rw.ac.uok.aisps.repository.RecommendationRepository;
import rw.ac.uok.aisps.repository.StudentRepository;
import rw.ac.uok.aisps.security.UserPrincipal;
import rw.ac.uok.aisps.service.DashboardService;

@RestController
@RequestMapping("/api/student")
@RequiredArgsConstructor
public class StudentController {

    private final DashboardService dashboardService;
    private final StudentRepository studentRepository;
    private final RecommendationRepository recommendationRepository;

    @GetMapping("/dashboard")
    public StudentDashboardResponse dashboard(@AuthenticationPrincipal UserPrincipal principal) {
        Long studentId = currentStudentId(principal);
        return dashboardService.studentDashboard(studentId);
    }

    @PatchMapping("/recommendations/{id}/acknowledge")
    public void acknowledge(@AuthenticationPrincipal UserPrincipal principal, @PathVariable Long id) {
        Long studentId = currentStudentId(principal);
        Recommendation rec = recommendationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Recommendation not found: " + id));
        if (!rec.getPrediction().getStudent().getId().equals(studentId)) {
            throw new org.springframework.security.access.AccessDeniedException("Not your recommendation");
        }
        rec.setStatus(RecommendationStatus.ACKNOWLEDGED);
        recommendationRepository.save(rec);
    }

    private Long currentStudentId(UserPrincipal principal) {
        return studentRepository.findByUser_Id(principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("No student profile for this account"))
                .getId();
    }
}
