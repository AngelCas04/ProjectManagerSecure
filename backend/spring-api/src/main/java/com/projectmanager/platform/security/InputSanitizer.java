package com.projectmanager.platform.security;

import org.springframework.stereotype.Component;

import java.util.Locale;

@Component
public class InputSanitizer {

    private static final String SAFE_INLINE_REGEX = "[^\\p{L}\\p{N} .,;:()_@\\-/#&]";
    private static final String SAFE_MULTILINE_REGEX = "[^\\p{L}\\p{N} .,;:()_@\\-/#&\\n]";

    public String sanitizePlainText(String value) {
        if (value == null) {
            return "";
        }

        return value.replaceAll(SAFE_INLINE_REGEX, "").replaceAll("\\s+", " ").trim();
    }

    public String sanitizeMultilineText(String value) {
        if (value == null) {
            return "";
        }

        return value.replaceAll(SAFE_MULTILINE_REGEX, "").replaceAll("\\n{3,}", "\n\n").trim();
    }

    public String normalizeEmail(String email) {
        return sanitizePlainText(email).replace(" ", "").toLowerCase(Locale.ROOT);
    }

    public String toInitials(String value) {
        String[] parts = sanitizePlainText(value).split(" ");
        StringBuilder builder = new StringBuilder();
        for (String part : parts) {
            if (!part.isBlank()) {
                builder.append(Character.toUpperCase(part.charAt(0)));
            }
            if (builder.length() == 2) {
                break;
            }
        }
        return builder.isEmpty() ? "PM" : builder.toString();
    }
}
