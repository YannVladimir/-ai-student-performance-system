package rw.ac.uok.aisps.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import rw.ac.uok.aisps.domain.Role;
import rw.ac.uok.aisps.domain.User;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmailIgnoreCase(String email);
    boolean existsByEmailIgnoreCase(String email);
    List<User> findByRole(Role role);
}
