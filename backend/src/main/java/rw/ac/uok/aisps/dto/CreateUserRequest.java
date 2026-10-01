package rw.ac.uok.aisps.dto;

import rw.ac.uok.aisps.domain.Role;

public record CreateUserRequest(String fullName, String email, Role role, String password) {
}
