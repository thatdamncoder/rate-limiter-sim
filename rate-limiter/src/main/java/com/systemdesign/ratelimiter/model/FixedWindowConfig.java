package com.systemdesign.ratelimiter.model;

public record FixedWindowConfig(
        int maxRequests,
        long windowSizeInSec
) {}
