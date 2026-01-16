package com.systemdesign.ratelimiter.model;

public record SlidingWindowConfig(
    int maxRequests,
    long windowSizeInSec
){}
