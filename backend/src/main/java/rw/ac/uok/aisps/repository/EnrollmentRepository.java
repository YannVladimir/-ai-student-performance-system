package rw.ac.uok.aisps.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import rw.ac.uok.aisps.domain.Enrollment;

import java.util.List;
import java.util.Optional;

public interface EnrollmentRepository extends JpaRepository<Enrollment, Long> {
    List<Enrollment> findByStudent_Id(Long studentId);
    List<Enrollment> findByCourse_Id(Long courseId);
    Optional<Enrollment> findByStudent_IdAndCourse_IdAndSemester(Long studentId, Long courseId, String semester);
    List<Enrollment> findByCourse_IdAndSemester(Long courseId, String semester);
}
