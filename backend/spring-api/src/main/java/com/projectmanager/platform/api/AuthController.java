package com.projectmanager.platform.api;

import com.projectmanager.platform.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ViewModels.AuthView register(
        @Valid @RequestBody AuthRequests.RegisterRequest request,
        HttpServletRequest httpRequest,
        HttpServletResponse response
    ) {
        return authService.register(request, httpRequest, response);
    }

    @PostMapping("/login")
    public ViewModels.AuthView login(
        @Valid @RequestBody AuthRequests.LoginRequest request,
        HttpServletRequest httpRequest,
        HttpServletResponse response
    ) {
        return authService.login(request, httpRequest, response);
    }

    @PostMapping("/refresh")
    public ViewModels.AuthView refresh(HttpServletRequest request, HttpServletResponse response) {
        return authService.refresh(request, response);
    }

    @PostMapping("/logout")
    public void logout(HttpServletRequest request, HttpServletResponse response) {
        authService.logout(request, response);
    }

    @GetMapping("/health")
    public String health() {
        return "ok";
    }
}
