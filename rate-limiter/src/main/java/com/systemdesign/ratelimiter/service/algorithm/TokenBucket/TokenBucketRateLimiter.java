package com.systemdesign.ratelimiter.service.algorithm.TokenBucket;

import com.systemdesign.ratelimiter.dto.RateLimiterHitResponse;
import com.systemdesign.ratelimiter.model.TokenBucketConfig;
import com.systemdesign.ratelimiter.service.algorithm.RateLimiter;
import com.systemdesign.ratelimiter.store.RateLimiterStore;

import java.util.Map;

public class TokenBucketRateLimiter implements RateLimiter {

    private final TokenBucketConfig config;
    private final RateLimiterStore<TokenBucketState> store;

    public TokenBucketRateLimiter(
            TokenBucketConfig config,
            RateLimiterStore<TokenBucketState> store
    ) {
        this.config = config;
        this.store = store;
    }

    @Override
    public RateLimiterHitResponse hitEndpoint(String clientId) {
        long now = System.currentTimeMillis();
        Result result = new Result();

        store.compute(clientId, (id, state) -> {
            // First request
            if (state == null) {
                result.allowed = true;
                result.tokensAfter = config.capacity() - 1;
                result.retryAfter = 0;

                return new TokenBucketState(
                        config.capacity() - 1,
                        now
                );
            }

            long elapsedMillis = now - state.lastRefillTimeMillis();
            double elapsedSeconds = elapsedMillis / 1000.0;
            double refilledTokens = state.tokens() + elapsedSeconds * config.refillRatePerSecond();
            double tokens = Math.min(config.capacity(), refilledTokens);

            if (tokens >= 1.0) {
                result.allowed = true;
                result.tokensAfter = tokens - 1;
                result.retryAfter = 0;

                return new TokenBucketState(
                        tokens - 1,
                        now
                );
            }

            // Not enough tokens
            result.allowed = false;
            result.tokensAfter = tokens;
            result.retryAfter = (long) Math.ceil(
                    (1.0 - tokens) / config.refillRatePerSecond()
            );

            return new TokenBucketState(
                    tokens,
                    state.lastRefillTimeMillis()
            );
        });

        return new RateLimiterHitResponse(
                result.allowed,
                result.allowed ? "Token consumed" : "No tokens available",
                now,
                result.retryAfter,
                (int) Math.floor(result.tokensAfter),
                Map.of(
                        "tokensRemaining", result.tokensAfter,
                        "bucketCapacity", config.capacity(),
                        "refillRatePerSecond", config.refillRatePerSecond()
                )
        );
    }
    @Override
    public void reset(){
        store.reset();
    }
    private static class Result {
        boolean allowed;
        double tokensAfter;
        long retryAfter;
    }
}
