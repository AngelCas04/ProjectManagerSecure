package com.projectmanager.platform.api;

import com.projectmanager.platform.service.BootstrapService;
import com.projectmanager.platform.service.CurrentUserService;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class WorkspaceController {

    private final BootstrapService bootstrapService;
    private final CurrentUserService currentUserService;

    public WorkspaceController(BootstrapService bootstrapService, CurrentUserService currentUserService) {
        this.bootstrapService = bootstrapService;
        this.currentUserService = currentUserService;
    }

    @GetMapping("/bootstrap")
    public ViewModels.BootstrapView bootstrap() {
        return bootstrapService.bootstrap(currentUserService.requireAuthenticatedUser());
    }

    @GetMapping("/security/csrf")
    public String csrf(CsrfToken token) {
        return token.getToken();
    }
}
