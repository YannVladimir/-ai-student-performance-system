package rw.ac.uok.aisps.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import rw.ac.uok.aisps.domain.Student;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface StudentRepository extends JpaRepository<Student, Long> {
    Optional<Student> findByUser_Id(Long userId);
    Optional<Student> findByRegistrationNo(String registrationNo);
    List<Student> findByRegistrationNoIn(Collection<String> registrationNumbers);
}
