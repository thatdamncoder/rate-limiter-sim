package com.systemdesign.ratelimiter.dto;

import com.systemdesign.ratelimiter.enums.RateLimiterAlgoType;

public record RateLimiterInitResponse(
    boolean allowed,
    String message,
    RateLimiterAlgoType algorithm
){}
