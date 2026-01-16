package com.systemdesign.ratelimiter.dto;

import java.util.Map;

public record RateLimiterHitResponse(
        boolean accepted,
        String message,
        long timestamp,
        long retryAfter,
        int remainingHits,
        Map<String, Object> metadata
) {}
