package rw.ac.uok.aisps.dto;

public record SystemHealthDto(
        long totalUsers,
        long totalStudents,
        long uptimeMillis,
        String mlServiceStatus
) {
}
