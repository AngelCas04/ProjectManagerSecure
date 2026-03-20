package com.projectmanager.platform.api;

import com.projectmanager.platform.service.CurrentUserService;
import com.projectmanager.platform.service.ProfileService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    private final ProfileService profileService;
    private final CurrentUserService currentUserService;

    public ProfileController(ProfileService profileService, CurrentUserService currentUserService) {
        this.profileService = profileService;
        this.currentUserService = currentUserService;
    }

    @PutMapping
    public ViewModels.UserView updateProfile(@Valid @RequestBody AuthRequests.UpdateProfileRequest request) {
        return profileService.updateProfile(request, currentUserService.requireAuthenticatedUser());
    }
}
