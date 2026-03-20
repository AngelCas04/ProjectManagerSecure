package com.projectmanager.platform.security;

import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class BruteForceProtectionService {

    private static final int MAX_ATTEMPTS = 5;
    private static final Duration LOCK_DURATION = Duration.ofMinutes(15);

    private final Map<String, AttemptState> attempts = new ConcurrentHashMap<>();

    public boolean isLocked(String key) {
        AttemptState state = attempts.get(key);
        return state != null && state.lockedUntil() != null && state.lockedUntil().isAfter(Instant.now());
    }

    public void recordFailure(String key) {
        attempts.compute(key, (ignored, current) -> {
            if (current == null) {
                return new AttemptState(1, null);
            }

            int next = current.failures() + 1;
            Instant lockedUntil = next >= MAX_ATTEMPTS ? Instant.now().plus(LOCK_DURATION) : current.lockedUntil();
            return new AttemptState(next, lockedUntil);
        });
    }

    public void recordSuccess(String key) {
        attempts.remove(key);
    }

    private record AttemptState(int failures, Instant lockedUntil) {
    }
}
