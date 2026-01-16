package com.systemdesign.ratelimiter.service.algorithm.FixedWindow;

import com.systemdesign.ratelimiter.dto.RateLimiterHitResponse;
import com.systemdesign.ratelimiter.model.FixedWindowConfig;
import com.systemdesign.ratelimiter.service.algorithm.RateLimiter;
import com.systemdesign.ratelimiter.store.RateLimiterStore;

import java.util.Map;

public class FixedWindowRateLimiter implements RateLimiter {

    private final FixedWindowConfig config;
    private final RateLimiterStore<FixedWindowState> store;

    public FixedWindowRateLimiter(
            FixedWindowConfig config,
            RateLimiterStore<FixedWindowState> store
    ) {
        this.config = config;
        this.store = store;
    }

    @Override
    public RateLimiterHitResponse hitEndpoint(String clientId) {

        long now = System.currentTimeMillis();
        long windowSizeMs = config.windowSizeInSec() * 1000L;

        Result result = new Result();

        store.compute(clientId, (id, state) -> {

            // New window
            if (state == null || now - state.windowStart() >= windowSizeMs) {
                result.allowed = true;
                result.countAfter = 1;
                result.retryAfter = 0;
                result.windowStart = now;
                return new FixedWindowState(1, now);
            }

            // Window full
            if (state.requestCount() >= config.maxRequests()) {
                result.allowed = false;
                result.countAfter = state.requestCount();
                result.windowStart = state.windowStart();

                long windowEndMs = state.windowStart() + windowSizeMs;
                long retryAfterMs = windowEndMs - now;
                result.retryAfter = (long) Math.ceil(retryAfterMs / 1000.0);

                return state;
            }

            // Accept request
            result.allowed = true;
            result.countAfter = state.requestCount() + 1;
            result.retryAfter = 0;
            result.windowStart = state.windowStart();

            return new FixedWindowState(
                    state.requestCount() + 1,
                    state.windowStart()
            );
        });

        int remainingCapacity =
                Math.max(0, config.maxRequests() - result.countAfter);

        long windowEndMs = result.windowStart + windowSizeMs;

        return new RateLimiterHitResponse(
                result.allowed,
                result.allowed
                        ? "Request allowed in fixed window"
                        : "Fixed window limit reached",
                now,
                result.retryAfter,
                remainingCapacity,
                Map.of(
                        "currentCount", result.countAfter,
                        "maxRequests", config.maxRequests(),
                        "windowStart", result.windowStart,
                        "windowEnd", windowEndMs
                )
        );
    }
    @Override
    public void reset(){
        store.reset();
    }

    private static class Result {
        boolean allowed;
        int countAfter;
        long retryAfter;
        long windowStart;
    }
}

/*
1. always send using request response object
2. it is not necessary to always init the members of a class using constructor.
you can make the constructor a default constructor and then use getters and setters to init the
variables.
3. always separate layers
 */
