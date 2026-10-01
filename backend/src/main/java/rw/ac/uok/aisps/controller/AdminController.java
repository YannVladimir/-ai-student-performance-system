package rw.ac.uok.aisps.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import rw.ac.uok.aisps.domain.Role;
import rw.ac.uok.aisps.domain.User;
import rw.ac.uok.aisps.domain.UserStatus;
import rw.ac.uok.aisps.dto.AdminAnalyticsResponse;
import rw.ac.uok.aisps.dto.AuditEntryDto;
import rw.ac.uok.aisps.dto.CreateUserRequest;
import rw.ac.uok.aisps.dto.SystemHealthDto;
import rw.ac.uok.aisps.repository.StudentRepository;
import rw.ac.uok.aisps.repository.UserRepository;
import rw.ac.uok.aisps.service.AuditService;
import rw.ac.uok.aisps.service.DashboardService;
import rw.ac.uok.aisps.service.MlClientService;
import rw.ac.uok.aisps.service.ReportService;
import rw.ac.uok.aisps.service.UserAdminService;

import java.lang.management.ManagementFactory;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final DashboardService dashboardService;
    private final MlClientService mlClientService;
    private final UserRepository userRepository;
    private final StudentRepository studentRepository;
    private final AuditService auditService;
    private final ReportService reportService;
    private final UserAdminService userAdminService;

    @GetMapping("/analytics")
    public AdminAnalyticsResponse analytics() {
        return dashboardService.adminAnalytics();
    }

    @GetMapping("/users")
    public List<User> users(@RequestParam(required = false) Role role) {
        return role != null ? userRepository.findByRole(role) : userRepository.findAll();
    }

    @PostMapping("/users")
    public User createUser(@RequestBody CreateUserRequest request) {
        return userAdminService.createUser(request);
    }

    @PatchMapping("/users/{id}/status")
    public User setUserStatus(@PathVariable Long id, @RequestParam UserStatus status) {
        return userAdminService.setStatus(id, status);
    }

    @GetMapping("/system/health")
    public SystemHealthDto systemHealth() {
        Map<String, Object> mlMetrics = mlClientService.metrics();
        String mlStatus = "unavailable".equals(mlMetrics.get("status")) ? "unavailable" : "ok";
        return new SystemHealthDto(
                userRepository.count(),
                studentRepository.count(),
                ManagementFactory.getRuntimeMXBean().getUptime(),
                mlStatus);
    }

    @GetMapping("/ml/metrics")
    public Map<String, Object> mlMetrics() {
        return mlClientService.metrics();
    }

    @PostMapping("/ml/retrain")
    public void retrain() {
        mlClientService.triggerRetrain();
    }

    @GetMapping("/audit")
    public List<AuditEntryDto> audit(@RequestParam(required = false) Long studentId,
                                      @RequestParam(required = false) Long courseId) {
        return auditService.recentEntries(studentId, courseId);
    }

    @GetMapping("/reports/excel")
    public ResponseEntity<byte[]> analyticsExcel() {
        byte[] bytes = reportService.generateAnalyticsExcel();
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=analytics-report.xlsx")
                .body(bytes);
    }

    @GetMapping("/reports/pdf")
    public ResponseEntity<byte[]> analyticsPdf() {
        byte[] bytes = reportService.generateAnalyticsPdf();
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=analytics-report.pdf")
                .body(bytes);
    }
}
