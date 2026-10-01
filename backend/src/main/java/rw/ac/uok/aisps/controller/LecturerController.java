package rw.ac.uok.aisps.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import rw.ac.uok.aisps.domain.Course;
import rw.ac.uok.aisps.domain.RiskLevel;
import rw.ac.uok.aisps.domain.Role;
import rw.ac.uok.aisps.dto.AtRiskStudentDto;
import rw.ac.uok.aisps.dto.CourseSummaryDto;
import rw.ac.uok.aisps.dto.PredictionSummaryDto;
import rw.ac.uok.aisps.dto.TrendPointDto;
import rw.ac.uok.aisps.dto.UploadHistoryDto;
import rw.ac.uok.aisps.dto.UploadResultDto;
import rw.ac.uok.aisps.exception.ResourceNotFoundException;
import rw.ac.uok.aisps.repository.CourseRepository;
import rw.ac.uok.aisps.security.UserPrincipal;
import rw.ac.uok.aisps.service.DashboardService;
import rw.ac.uok.aisps.service.DataUploadService;
import rw.ac.uok.aisps.service.PredictionService;

import java.util.List;

@RestController
@RequestMapping("/api/lecturer")
@RequiredArgsConstructor
public class LecturerController {

    private final DashboardService dashboardService;
    private final DataUploadService dataUploadService;
    private final PredictionService predictionService;
    private final CourseRepository courseRepository;

    @GetMapping("/courses")
    public List<CourseSummaryDto> myCourses(@AuthenticationPrincipal UserPrincipal principal) {
        return dashboardService.lecturerCourses(principal.getId());
    }

    @GetMapping("/courses/{courseId}/at-risk")
    public List<AtRiskStudentDto> atRiskStudents(@AuthenticationPrincipal UserPrincipal principal,
                                                  @PathVariable Long courseId,
                                                  @RequestParam String semester,
                                                  @RequestParam(required = false) RiskLevel minLevel) {
        assertOwnsCourse(principal, courseId);
        return dashboardService.atRiskStudentsForCourse(courseId, semester, minLevel);
    }

    @PostMapping(value = "/upload", consumes = "multipart/form-data")
    public UploadResultDto upload(@AuthenticationPrincipal UserPrincipal principal,
                                   @RequestParam("file") MultipartFile file,
                                   @RequestParam Long courseId,
                                   @RequestParam String semester) {
        assertOwnsCourse(principal, courseId);
        return dataUploadService.processAcademicDataCsv(file, courseId, semester, principal.getId());
    }

    @GetMapping("/courses/{courseId}/uploads")
    public List<UploadHistoryDto> uploadHistory(@AuthenticationPrincipal UserPrincipal principal,
                                                 @PathVariable Long courseId) {
        assertOwnsCourse(principal, courseId);
        return dataUploadService.getUploadHistory(courseId);
    }

    @GetMapping("/courses/{courseId}/trends")
    public List<TrendPointDto> trends(@AuthenticationPrincipal UserPrincipal principal,
                                       @PathVariable Long courseId) {
        assertOwnsCourse(principal, courseId);
        return dashboardService.riskTrendBySemester(courseId);
    }

    @PostMapping("/courses/{courseId}/predict")
    public List<PredictionSummaryDto> generatePredictions(@AuthenticationPrincipal UserPrincipal principal,
                                                            @PathVariable Long courseId,
                                                            @RequestParam String semester) {
        assertOwnsCourse(principal, courseId);
        return predictionService.generateForCourse(courseId, semester).stream()
                .map(p -> new PredictionSummaryDto(
                        p.getStudent().getId(), p.getRiskLevel().name(), p.getConfidenceScore()))
                .toList();
    }

    private void assertOwnsCourse(UserPrincipal principal, Long courseId) {
        if (principal.getUser().getRole() == Role.ADMIN) return;
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found: " + courseId));
        if (course.getLecturer() == null || !course.getLecturer().getId().equals(principal.getId())) {
            throw new AccessDeniedException("You do not teach this course");
        }
    }
}
