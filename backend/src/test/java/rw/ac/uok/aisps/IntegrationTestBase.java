package rw.ac.uok.aisps;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import rw.ac.uok.aisps.domain.Role;
import rw.ac.uok.aisps.domain.User;
import rw.ac.uok.aisps.repository.CourseRepository;
import rw.ac.uok.aisps.repository.StudentRepository;
import rw.ac.uok.aisps.repository.UserRepository;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Shared setup for controller-level integration tests: boots the full Spring
 * context against H2 (in MySQL-compatible mode), lets DataSeeder populate the
 * synthetic demo dataset, and provides helpers to log in as a seeded user of
 * a given role using the documented demo passwords (see README).
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
@AutoConfigureMockMvc
@ActiveProfiles("h2")
public abstract class IntegrationTestBase {

    @Autowired
    protected MockMvc mockMvc;

    @Autowired
    protected ObjectMapper objectMapper;

    @Autowired
    protected UserRepository userRepository;

    @Autowired
    protected StudentRepository studentRepository;

    @Autowired
    protected CourseRepository courseRepository;

    protected static final String ADMIN_PASSWORD = "Admin@12345";
    protected static final String MANAGEMENT_PASSWORD = "Management@12345";
    protected static final String LECTURER_PASSWORD = "Lecturer@12345";
    protected static final String STUDENT_PASSWORD = "Student@12345";

    @BeforeEach
    void ensureSeeded() {
        // DataSeeder (a CommandLineRunner) already ran at context startup.
        if (userRepository.count() == 0) {
            throw new IllegalStateException("Expected DataSeeder to have populated the demo dataset");
        }
    }

    protected User anyUserWithRole(Role role) {
        return userRepository.findByRole(role).stream().findFirst()
                .orElseThrow(() -> new IllegalStateException("No seeded user with role " + role));
    }

    protected String loginAndGetToken(String email, String password) throws Exception {
        String body = objectMapper.writeValueAsString(new LoginPayload(email, password));
        String response = mockMvc.perform(post("/api/auth/login")
                        .contentType("application/json")
                        .content(body))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(response).get("token").asText();
    }

    protected String tokenFor(Role role) throws Exception {
        User user = anyUserWithRole(role);
        String password = switch (role) {
            case ADMIN -> ADMIN_PASSWORD;
            case MANAGEMENT -> MANAGEMENT_PASSWORD;
            case LECTURER -> LECTURER_PASSWORD;
            case STUDENT -> STUDENT_PASSWORD;
        };
        return loginAndGetToken(user.getEmail(), password);
    }

    private record LoginPayload(String email, String password) {
    }
}
