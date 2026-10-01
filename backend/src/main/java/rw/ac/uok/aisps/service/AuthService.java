package rw.ac.uok.aisps.service;

import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Service;
import rw.ac.uok.aisps.domain.User;
import rw.ac.uok.aisps.dto.LoginRequest;
import rw.ac.uok.aisps.dto.LoginResponse;
import rw.ac.uok.aisps.exception.ResourceNotFoundException;
import rw.ac.uok.aisps.repository.UserRepository;
import rw.ac.uok.aisps.security.JwtService;
import rw.ac.uok.aisps.security.UserPrincipal;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UserRepository userRepository;

    public LoginResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password()));

        User user = userRepository.findByEmailIgnoreCase(request.email())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        String token = jwtService.generateToken(new UserPrincipal(user));

        return new LoginResponse(token, user.getId(), user.getFullName(), user.getEmail(), user.getRole().name());
    }
}
