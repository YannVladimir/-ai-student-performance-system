package rw.ac.uok.aisps.service;

import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import rw.ac.uok.aisps.domain.User;
import rw.ac.uok.aisps.domain.UserStatus;
import rw.ac.uok.aisps.dto.CreateUserRequest;
import rw.ac.uok.aisps.exception.BadRequestException;
import rw.ac.uok.aisps.exception.ResourceNotFoundException;
import rw.ac.uok.aisps.repository.UserRepository;

/** Backs the System Admin "manage user accounts" duty from the role diagram. */
@Service
@RequiredArgsConstructor
public class UserAdminService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public User createUser(CreateUserRequest request) {
        if (userRepository.existsByEmailIgnoreCase(request.email())) {
            throw new BadRequestException("A user with this email already exists: " + request.email());
        }
        User user = User.builder()
                .fullName(request.fullName())
                .email(request.email())
                .role(request.role())
                .passwordHash(passwordEncoder.encode(request.password()))
                .status(UserStatus.ACTIVE)
                .build();
        return userRepository.save(user);
    }

    public User setStatus(Long userId, UserStatus status) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
        user.setStatus(status);
        return userRepository.save(user);
    }
}
