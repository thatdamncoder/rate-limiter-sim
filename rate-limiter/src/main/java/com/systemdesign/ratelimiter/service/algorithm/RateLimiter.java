package com.systemdesign.ratelimiter.service.algorithm;


import com.systemdesign.ratelimiter.dto.RateLimiterHitResponse;

public interface RateLimiter {
    RateLimiterHitResponse hitEndpoint(String clientId);
    void reset();
}
