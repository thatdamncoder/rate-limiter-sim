package com.systemdesign.ratelimiter.service.algorithm.LeakyBucket;

import com.systemdesign.ratelimiter.dto.RateLimiterHitResponse;
import com.systemdesign.ratelimiter.model.LeakyBucketConfig;
import com.systemdesign.ratelimiter.service.algorithm.RateLimiter;
import com.systemdesign.ratelimiter.store.RateLimiterStore;

import java.util.Map;

public class LeakyBucketRateLimiter implements RateLimiter {

    private final LeakyBucketConfig config;
    private final RateLimiterStore<LeakyBucketState> store;

    public LeakyBucketRateLimiter(
            LeakyBucketConfig config,
            RateLimiterStore<LeakyBucketState> store
    ) {
        this.config = config;
        this.store = store;
    }

    private static class Result {
        boolean allowed;
        double waterAfter;
        long retryAfterSeconds;
    }

    @Override
    public RateLimiterHitResponse hitEndpoint(String clientId) {
        long now = System.currentTimeMillis();
        Result result = new Result();

        store.compute(clientId, (id, state) -> {

            if (state == null) {
                result.allowed = true;
                result.waterAfter = 1;
                result.retryAfterSeconds = 0;
                return new LeakyBucketState(1, now);
            }

            // elapsed time in SECONDS
            double elapsedSeconds =
                    (now - state.lastLeakTimeInMillis()) / 1000.0;

            // leak using per-second rate
            double leaked =
                    elapsedSeconds * config.leakRateInSec();

            double water =
                    Math.max(0, state.currentWater() - leaked);

            if (water + 1 <= config.bucketCapacity()) {
                result.allowed = true;
                water += 1;
                result.waterAfter = water;
                result.retryAfterSeconds = 0;
            } else {
                result.allowed = false;
                result.waterAfter = water;

                // seconds until 1 request leaks out
                double secondsToLeakOne =
                        (water - config.bucketCapacity() + 1)
                                / config.leakRateInSec();

                result.retryAfterSeconds =
                        (long) Math.ceil(secondsToLeakOne);
            }

            return new LeakyBucketState(water, now);
        });

        int remainingCapacity = Math.max(
                0,
                (int) Math.floor(config.bucketCapacity() - result.waterAfter)
        );

        return new RateLimiterHitResponse(
                result.allowed,
                result.allowed ? "ALLOWED" : "BLOCKED",
                now,
                result.retryAfterSeconds,
                remainingCapacity,
                Map.of(
                        "queueSize", result.waterAfter,
                        "capacity", config.bucketCapacity(),
                        "leakRatePerSec", config.leakRateInSec()
                )
        );
    }
    @Override
    public void reset(){
        store.reset();
    }
}
