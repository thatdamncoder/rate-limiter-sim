package com.systemdesign.ratelimiter.service.algorithm.SlidingWindow.SlidingWindowLog;

import com.systemdesign.ratelimiter.dto.RateLimiterHitResponse;
import com.systemdesign.ratelimiter.model.SlidingWindowConfig;
import com.systemdesign.ratelimiter.service.algorithm.RateLimiter;
import com.systemdesign.ratelimiter.store.RateLimiterStore;

import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;

public class SlidingWindowLogRateLimiter implements RateLimiter {

    private final SlidingWindowConfig config;
    private final RateLimiterStore<Deque<Long>> store;

    public SlidingWindowLogRateLimiter(
            SlidingWindowConfig config,
            RateLimiterStore<Deque<Long>> store
    ) {
        this.config = config;
        this.store = store;
    }

    @Override
    public RateLimiterHitResponse hitEndpoint(String clientId) {

        long now = System.currentTimeMillis();

        long windowSizeSec = config.windowSizeInSec();
        long windowSizeMs = windowSizeSec * 1000L;

        long windowLowerBound = now - windowSizeMs;

        class Result {
            boolean allowed;
            int sizeAfter;
            int remainingHits;
            long retryAfterSeconds;
        }

        Result result = new Result();

        store.compute(clientId, (id, deque) -> {

            if (deque == null) {
                deque = new ArrayDeque<>();
            }

            // Evict old requests
            while (!deque.isEmpty() && deque.peekFirst() < windowLowerBound) {
                deque.pollFirst();
            }

            if (deque.size() < config.maxRequests()) {
                deque.addLast(now);
                result.allowed = true;
                result.retryAfterSeconds = 0;
            } else {
                result.allowed = false;

                long earliestRequestMs = deque.peekFirst();
                long retryAfterMs =
                        (earliestRequestMs + windowSizeMs) - now;

                result.retryAfterSeconds =
                        (long) Math.ceil(retryAfterMs / 1000.0);
            }

            result.sizeAfter = deque.size();
            result.remainingHits = Math.max(
                    0,
                    config.maxRequests() - deque.size()
            );

            return deque;
        });

        return new RateLimiterHitResponse(
                result.allowed,
                result.allowed ? "ALLOWED" : "BLOCKED",
                now,
                result.retryAfterSeconds,
                result.remainingHits,
                Map.of(
                        "currentWindowSize", result.sizeAfter,
                        "maxRequests", config.maxRequests(),
                        "windowSizeSeconds", windowSizeSec,
                        "windowLowerBoundMillis", windowLowerBound,
                        "nowMillis", now
                )
        );
    }

    @Override
    public void reset(){
        store.reset();
    }
}
