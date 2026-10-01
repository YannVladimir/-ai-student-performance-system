package rw.ac.uok.aisps.controller;

import org.junit.jupiter.api.Test;
import rw.ac.uok.aisps.IntegrationTestBase;
import rw.ac.uok.aisps.domain.Role;
import rw.ac.uok.aisps.domain.User;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Recreates Table 11 (Thesis Section 4.7.3): TC-01, TC-02, TC-10.
 */
class AuthControllerTest extends IntegrationTestBase {

    // TC-01: Login with valid credentials for each role -> correct role-based dashboard access
    @Test
    void loginAsAdmin_grantsAccessToAdminDashboard() throws Exception {
        User admin = anyUserWithRole(Role.ADMIN);
        String token = loginAndGetToken(admin.getEmail(), ADMIN_PASSWORD);

        mockMvc.perform(get("/api/admin/analytics").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
    }

    @Test
    void loginAsStudent_grantsAccessToStudentDashboard() throws Exception {
        User student = anyUserWithRole(Role.STUDENT);
        String token = loginAndGetToken(student.getEmail(), STUDENT_PASSWORD);

        mockMvc.perform(get("/api/student/dashboard").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
    }

    @Test
    void loginAsStudent_deniedAccessToAdminDashboard() throws Exception {
        User student = anyUserWithRole(Role.STUDENT);
        String token = loginAndGetToken(student.getEmail(), STUDENT_PASSWORD);

        mockMvc.perform(get("/api/admin/analytics").header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    // TC-02: Login with invalid credentials -> access denied with appropriate error message
    @Test
    void loginWithWrongPassword_isRejected() throws Exception {
        User admin = anyUserWithRole(Role.ADMIN);
        String body = objectMapper.writeValueAsString(new Object() {
            public final String email = admin.getEmail();
            public final String password = "wrong-password";
        });

        mockMvc.perform(post("/api/auth/login").contentType("application/json").content(body))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").exists());
    }

    @Test
    void loginWithUnknownEmail_isRejected() throws Exception {
        String body = objectMapper.writeValueAsString(new Object() {
            public final String email = "nobody@uok.ac.rw";
            public final String password = "whatever123";
        });

        mockMvc.perform(post("/api/auth/login").contentType("application/json").content(body))
                .andExpect(status().isUnauthorized());
    }

    // TC-10: SQL injection attempt on login form -> system rejects malicious input, database not exposed.
    // First line of defense: Bean Validation rejects anything that isn't a well-formed email,
    // which already blocks classic quote-based payloads before they reach any query.
    @Test
    void sqlInjectionAttemptOnLogin_rejectedByInputValidation() throws Exception {
        String body = objectMapper.writeValueAsString(new Object() {
            public final String email = "' OR '1'='1";
            public final String password = "' OR '1'='1";
        });

        mockMvc.perform(post("/api/auth/login").contentType("application/json").content(body))
                .andExpect(status().isBadRequest());
    }

    // Second line of defense: even if an injection payload were a syntactically valid
    // string, the repository lookup is a parameterized JPA query (no string concatenation),
    // so the payload is just treated as a literal, non-matching value -- proven directly
    // at the persistence layer, independent of the validation layer above.
    @Test
    void userLookup_treatsInjectionPayloadAsLiteralValue_notAsSql() {
        var result = userRepository.findByEmailIgnoreCase("x' OR '1'='1' -- ");
        assertTrue(result.isEmpty());
        assertTrue(userRepository.count() > 0, "the injection attempt must not have altered/wiped the table");
    }
}
