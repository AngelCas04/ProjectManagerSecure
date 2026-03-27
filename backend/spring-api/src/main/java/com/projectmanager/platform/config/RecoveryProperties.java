package com.projectmanager.platform.config;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties(prefix = "app.recovery")
public class RecoveryProperties {

    @NotBlank
    private String frontendBaseUrl = "http://localhost:5173";

    @NotBlank
    private String resetPath = "/reset-password";

    @Min(300)
    @Max(7200)
    private int tokenTtlSeconds = 1800;

    @NotBlank
    private String senderAddress = "noreply@projectmanager.local";

    @NotBlank
    private String senderName = "Project Manager Secure";

    public String getFrontendBaseUrl() {
        return frontendBaseUrl;
    }

    public void setFrontendBaseUrl(String frontendBaseUrl) {
        this.frontendBaseUrl = frontendBaseUrl;
    }

    public String getResetPath() {
        return resetPath;
    }

    public void setResetPath(String resetPath) {
        this.resetPath = resetPath;
    }

    public int getTokenTtlSeconds() {
        return tokenTtlSeconds;
    }

    public void setTokenTtlSeconds(int tokenTtlSeconds) {
        this.tokenTtlSeconds = tokenTtlSeconds;
    }

    public String getSenderAddress() {
        return senderAddress;
    }

    public void setSenderAddress(String senderAddress) {
        this.senderAddress = senderAddress;
    }

    public String getSenderName() {
        return senderName;
    }

    public void setSenderName(String senderName) {
        this.senderName = senderName;
    }
}
