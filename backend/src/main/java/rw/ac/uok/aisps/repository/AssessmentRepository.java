package rw.ac.uok.aisps.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import rw.ac.uok.aisps.domain.Assessment;

import java.util.List;
import java.util.Optional;

public interface AssessmentRepository extends JpaRepository<Assessment, Long> {
    List<Assessment> findByStudent_Id(Long studentId);
    Optional<Assessment> findByStudent_IdAndCourse_IdAndSemester(Long studentId, Long courseId, String semester);
    List<Assessment> findByCourse_IdAndSemester(Long courseId, String semester);
}
