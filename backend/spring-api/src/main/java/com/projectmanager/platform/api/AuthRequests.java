package com.projectmanager.platform.api;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public final class AuthRequests {

    private AuthRequests() {
    }

    public record LoginRequest(
        @NotBlank @Email @Size(max = 190) String email,
        @NotBlank @Size(min = 12, max = 72) String password
    ) {
    }

    public record RegisterRequest(
        @NotBlank @Size(max = 60) String name,
        @NotBlank @Email @Size(max = 190) String email,
        @NotBlank @Size(min = 12, max = 72) String password,
        @Size(max = 60) String team,
        @Pattern(regexp = "ADMINISTRADOR|MIEMBRO_PROYECTO") String accountType,
        @Size(max = 180) String inviteToken
    ) {
    }

    public record ForgotPasswordRequest(
        @NotBlank @Email @Size(max = 190) String email,
        @JsonAlias("recoveryWord")
        @NotBlank @Size(min = 6, max = 80) String recoveryPhrase
    ) {
    }

    public record ResetPasswordRequest(
        @NotBlank @Size(min = 32, max = 180) String token,
        @NotBlank @Size(min = 12, max = 72) String password
    ) {
    }

    public record UpdateProfileRequest(
        @NotBlank @Size(max = 60) String name,
        @NotBlank @Email @Size(max = 190) String email,
        @NotBlank @Size(max = 60) String team,
        @NotBlank @Pattern(regexp = "Administrador|Miembro del proyecto") String role
        ,
        @Size(max = 200000) String avatarUrl
    ) {
    }
}
