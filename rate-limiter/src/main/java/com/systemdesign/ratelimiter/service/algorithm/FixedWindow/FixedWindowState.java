package com.systemdesign.ratelimiter.service.algorithm.FixedWindow;

public record FixedWindowState(
        int requestCount,
        long windowStart
){}
