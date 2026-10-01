package rw.ac.uok.aisps.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import rw.ac.uok.aisps.domain.Attendance;

import java.util.List;
import java.util.Optional;

public interface AttendanceRepository extends JpaRepository<Attendance, Long> {
    List<Attendance> findByStudent_Id(Long studentId);
    Optional<Attendance> findByStudent_IdAndCourse_IdAndSemester(Long studentId, Long courseId, String semester);
    List<Attendance> findByCourse_IdAndSemester(Long courseId, String semester);
}
