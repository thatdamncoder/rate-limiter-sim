package com.systemdesign.ratelimiter.enums;

public enum RateLimiterAlgoType {
    FIXED_WINDOW,
    TOKEN_BUCKET,
    SLIDING_WINDOW_LOG,
    SLIDING_WINDOW_COUNTER,
    LEAKY_BUCKET
}
