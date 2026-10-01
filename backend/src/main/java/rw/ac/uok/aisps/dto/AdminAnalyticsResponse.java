package rw.ac.uok.aisps.dto;

import java.util.List;
import java.util.Map;

public record AdminAnalyticsResponse(
        long totalStudents,
        long totalCourses,
        Map<String, Long> riskDistribution,
        List<ProgramRiskSummary> byProgram,
        List<CourseRiskSummary> byCourse
) {
    public record ProgramRiskSummary(String program, long low, long medium, long high) {
    }

    public record CourseRiskSummary(String courseCode, String courseName, long low, long medium, long high) {
    }
}
