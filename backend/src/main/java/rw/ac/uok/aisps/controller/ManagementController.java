package rw.ac.uok.aisps.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import rw.ac.uok.aisps.domain.RiskLevel;
import rw.ac.uok.aisps.dto.AdminAnalyticsResponse;
import rw.ac.uok.aisps.dto.AtRiskStudentDto;
import rw.ac.uok.aisps.dto.StudentDashboardResponse;
import rw.ac.uok.aisps.dto.StudentOverviewDto;
import rw.ac.uok.aisps.dto.TrendPointDto;
import rw.ac.uok.aisps.service.DashboardService;
import rw.ac.uok.aisps.service.ReportService;

import java.util.List;

/**
 * University Management view (Section per the role diagram): read-only
 * institution-wide reports/analytics, student welfare monitoring, and
 * performance trends. Unlike System Admin, this role cannot manage user
 * accounts or the ML models.
 */
@RestController
@RequestMapping("/api/management")
@RequiredArgsConstructor
public class ManagementController {

    private final DashboardService dashboardService;
    private final ReportService reportService;

    @GetMapping("/analytics")
    public AdminAnalyticsResponse analytics() {
        return dashboardService.adminAnalytics();
    }

    @GetMapping("/welfare")
    public List<AtRiskStudentDto> welfare(@RequestParam(required = false) String semester,
                                           @RequestParam(required = false) RiskLevel minLevel) {
        return dashboardService.atRiskInstitutionWide(semester, minLevel);
    }

    @GetMapping("/trends")
    public List<TrendPointDto> trends() {
        return dashboardService.riskTrendBySemester(null);
    }

    /** Overall performance/risk per student, institution-wide (worst risk across
     * all their courses). Pairs with {@link #studentDetail} for the per-course
     * breakdown ("risk by course") of any one student. */
    @GetMapping("/students")
    public List<StudentOverviewDto> students() {
        return dashboardService.studentOverviewInstitutionWide();
    }

    @GetMapping("/students/{studentId}")
    public StudentDashboardResponse studentDetail(@PathVariable Long studentId) {
        return dashboardService.studentDashboard(studentId);
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
