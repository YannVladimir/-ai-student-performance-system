package rw.ac.uok.aisps.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import rw.ac.uok.aisps.domain.Course;

import java.util.List;
import java.util.Optional;

public interface CourseRepository extends JpaRepository<Course, Long> {
    List<Course> findByLecturer_Id(Long lecturerId);
    Optional<Course> findByCourseCode(String courseCode);
    boolean existsByCourseCode(String courseCode);
}
