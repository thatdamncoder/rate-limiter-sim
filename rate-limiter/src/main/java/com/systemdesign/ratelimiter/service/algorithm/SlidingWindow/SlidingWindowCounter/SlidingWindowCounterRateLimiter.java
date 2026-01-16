package com.systemdesign.ratelimiter.service.algorithm.SlidingWindow.SlidingWindowCounter;

import com.systemdesign.ratelimiter.dto.RateLimiterHitResponse;
import com.systemdesign.ratelimiter.model.SlidingWindowConfig;
import com.systemdesign.ratelimiter.service.algorithm.RateLimiter;
import com.systemdesign.ratelimiter.store.RateLimiterStore;

import java.util.Map;

public class SlidingWindowCounterRateLimiter implements RateLimiter {

    private final SlidingWindowConfig config;
    private final RateLimiterStore<SlidingWindowCounterState[]> store;

    public SlidingWindowCounterRateLimiter(
            SlidingWindowConfig config,
            RateLimiterStore<SlidingWindowCounterState[]> store
    ) {
        this.config = config;
        this.store = store;
    }

    @Override
    public RateLimiterHitResponse hitEndpoint(String clientId) {

        long now = System.currentTimeMillis();

        long windowSizeSec = config.windowSizeInSec();
        long windowSizeMs = windowSizeSec * 1000L; // seconds → ms

        long currentWindowStart =
                (now / windowSizeMs) * windowSizeMs;

        class Result {
            boolean allowed;
            int currCount;
            int prevCount;
            double estimatedCount;
            long retryAfterSeconds;
        }

        Result result = new Result();

        store.compute(clientId, (id, state) -> {

            SlidingWindowCounterState current;
            SlidingWindowCounterState previous;

            if (state == null) {
                current = new SlidingWindowCounterState(0, currentWindowStart);
                previous = new SlidingWindowCounterState(0, currentWindowStart - windowSizeMs);
            } else {
                current = state[0];
                previous = state[1];

                if (current.windowStartInMillis() != currentWindowStart) {

                    long windowDiff =
                            (currentWindowStart - current.windowStartInMillis()) / windowSizeMs;

                    if (windowDiff == 1) {
                        // Normal adjacent window shift
                        previous = new SlidingWindowCounterState(
                                current.count(),
                                current.windowStartInMillis()
                        );
                    } else {
                        // Gap >= 2 windows → previous becomes irrelevant
                        previous = new SlidingWindowCounterState(
                                0,
                                currentWindowStart - windowSizeMs
                        );
                    }

                    current = new SlidingWindowCounterState(0, currentWindowStart);
                }

            }

            // elapsed time in current window (ms)
            double elapsedMs = now - current.windowStartInMillis();

            // weight based on remainingHits time
            double percentageIntoCurrentWindow = elapsedMs / windowSizeMs;
            double previousWindowWeight = 1.0 - percentageIntoCurrentWindow;
            double estimatedBefore =
                    (previous.count() * previousWindowWeight) + current.count();
            double estimatedAfter = estimatedBefore + 1;

            if (estimatedAfter <= config.maxRequests()) {
                result.allowed = true;
                current = new SlidingWindowCounterState(
                        current.count() + 1,
                        current.windowStartInMillis()
                );
                result.retryAfterSeconds = 0;
            } else {
                result.allowed = false;

                long windowEndMs = current.windowStartInMillis() + windowSizeMs;
                long retryAfterMs = windowEndMs - now;

                result.retryAfterSeconds =
                        (long) Math.ceil(retryAfterMs / 1000.0);
            }

            result.currCount = current.count();
            result.prevCount = previous.count();
            result.estimatedCount =
                    result.allowed ? estimatedAfter : estimatedBefore;

            return new SlidingWindowCounterState[]{current, previous};
        });

        int remainingHits = Math.max(
                0,
                (int) Math.floor(config.maxRequests() - result.estimatedCount)
        );
        return new RateLimiterHitResponse(
                result.allowed,
                result.allowed ? "ALLOWED" : "BLOCKED",
                now,
                result.retryAfterSeconds, // seconds,
                remainingHits,
                Map.of(
                        "currentWindowCount", result.currCount,
                        "previousWindowCount", result.prevCount,
                        "estimatedCount", result.estimatedCount,
                        "windowStartInMillis", currentWindowStart,
                        "windowEndInMillis", currentWindowStart + windowSizeMs
                )
        );
    }

    @Override
    public void reset(){
        store.reset();
    }
}
/*
Base URL
http://localhost:8080/api

1.Initialize Rate Limiter
Endpoint
POST /api/init

Request Body (JSON)
{
  "algorithm": "FIXED_WINDOW | SLIDING_WINDOW_COUNTER | SLIDING_WINDOW_LOG | LEAKY_BUCKET | TOKEN_BUCKET",
  "maxRequests": number,     // required for window-based algorithms
  "windowSize": number,      // window size in SECONDS
  "bucketCapacity": number,  // required for bucket algorithms
  "refillRate": number,      // token bucket: tokens per second
  "leakRate": number         // leaky bucket: requests per second
}
Only fields relevant to the chosen algorithm will be present.

Response
{
  "allowed": true,
  "message": "Rate limiter initialized",
  "algorithm": "FIXED_WINDOW"
}


Frontend must store "algorithm" to interpret /hit responses correctly.

2. Hit Rate-Limited Endpoint
Endpoint
GET /api/hit
Each call represents one request attempt.
Client is identified by IP (HttpServletRequest.getRemoteAddr()).

HTTP Status Codes
Request allowed	200 OK
Rate limited	429 TOO_MANY_REQUESTS
Limiter not initialized	400 BAD REQUEST
Common Response Format
{
  "accepted": true | false,
  "message": "ALLOWED | BLOCKED | algorithm-specific message",
  "timestamp": epochMillis, (in millisecond)
  "retryAfter": seconds, (in seconds always)
  "metadata": { ... } (algorithm-specific fields)
}

3. Algorithm-Specific Metadata & Behavior
FIXED WINDOW
{
  "currentCount": number,
  "maxRequests": number,
  "windowStart": epochMillis, (in millisecond)
  "windowEnd": epochMillis, (in millisecond)
}
SLIDING WINDOW COUNTER
{
  "currentWindowCount": number,
  "previousWindowCount": number,
  "estimatedCount": number,
  "windowStartInMillis": epochMillis, (in millisecond)
  "windowEndInMillis": epochMillis (in millisecond)
}
SLIDING WINDOW LOG
{
  "currentWindowSize": number,
  "maxRequests": number,
  "windowSizeSeconds": number,
  "windowLowerBoundMillis": epochMillis, (in millisecond)
  "nowMillis": epochMillis (in millisecond)
}
LEAKY BUCKET
{
  "queueSize": number,
  "capacity": number,
  "leakRatePerSec": number
}
TOKEN BUCKET
{
  "tokensRemaining": number,
  "bucketCapacity": number,
  "refillRatePerSecond": number
}

4. Reset Rate Limiter
Endpoint
POST /api/reset
Behavior
Clears all internal state
Frontend should reset counters, animations, and visuals
 */