package com.projectmanager.platform.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private final RequestMetadataService requestMetadataService;
    private final Map<String, Deque<Instant>> windows = new ConcurrentHashMap<>();

    public RateLimitFilter(RequestMetadataService requestMetadataService) {
        this.requestMetadataService = requestMetadataService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
        throws ServletException, IOException {
        RateLimitPolicy policy = policyFor(request.getRequestURI());
        if (policy == null) {
            filterChain.doFilter(request, response);
            return;
        }

        String key = policy.bucket() + ":" + requestMetadataService.clientIp(request);
        if (!allow(key, policy.maxRequests(), policy.window())) {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType("application/json");
            response.getWriter().write("{\"message\":\"Rate limit exceeded.\"}");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private boolean allow(String key, int maxRequests, Duration window) {
        Deque<Instant> queue = windows.computeIfAbsent(key, ignored -> new ArrayDeque<>());
        Instant cutoff = Instant.now().minus(window);
        synchronized (queue) {
            while (!queue.isEmpty() && queue.peekFirst().isBefore(cutoff)) {
                queue.removeFirst();
            }
            if (queue.size() >= maxRequests) {
                return false;
            }
            queue.addLast(Instant.now());
            return true;
        }
    }

    private RateLimitPolicy policyFor(String uri) {
        if (uri.startsWith("/api/auth")) {
            return new RateLimitPolicy("auth", 20, Duration.ofMinutes(1));
        }
        if (uri.startsWith("/api/projects") || uri.startsWith("/api/tasks") || uri.startsWith("/api/events")) {
            return new RateLimitPolicy("write", 90, Duration.ofMinutes(1));
        }
        if (uri.startsWith("/api/messages")) {
            return new RateLimitPolicy("chat", 120, Duration.ofMinutes(1));
        }
        return null;
    }

    private record RateLimitPolicy(String bucket, int maxRequests, Duration window) {
    }
}
