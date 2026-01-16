package com.systemdesign.ratelimiter.service.factory;

import com.systemdesign.ratelimiter.dto.RateLimiterInitRequest;
import com.systemdesign.ratelimiter.enums.RateLimiterAlgoType;
import com.systemdesign.ratelimiter.model.*;
import com.systemdesign.ratelimiter.service.algorithm.FixedWindow.FixedWindowRateLimiter;
import com.systemdesign.ratelimiter.service.algorithm.FixedWindow.FixedWindowState;
import com.systemdesign.ratelimiter.service.algorithm.LeakyBucket.LeakyBucketRateLimiter;
import com.systemdesign.ratelimiter.service.algorithm.LeakyBucket.LeakyBucketState;
import com.systemdesign.ratelimiter.service.algorithm.RateLimiter;
import com.systemdesign.ratelimiter.service.algorithm.SlidingWindow.SlidingWindowCounter.SlidingWindowCounterRateLimiter;
import com.systemdesign.ratelimiter.service.algorithm.SlidingWindow.SlidingWindowCounter.SlidingWindowCounterState;
import com.systemdesign.ratelimiter.service.algorithm.SlidingWindow.SlidingWindowLog.SlidingWindowLogRateLimiter;
import com.systemdesign.ratelimiter.service.algorithm.TokenBucket.TokenBucketRateLimiter;
import com.systemdesign.ratelimiter.service.algorithm.TokenBucket.TokenBucketState;
import com.systemdesign.ratelimiter.store.RateLimiterStore;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;

import java.util.Deque;

@Component
public class RateLimiterFactory {

    private final RateLimiterStore<FixedWindowState> fixedWindowStore;
    private final RateLimiterStore<TokenBucketState> tokenBucketStore;
    private final RateLimiterStore<LeakyBucketState> leakyBucketStore;
    private final RateLimiterStore<SlidingWindowCounterState[]> slidingWindowCounterStore;
    private final RateLimiterStore<Deque<Long>> slidingWindowLogStore;

    public RateLimiterFactory(
            @Qualifier("fixedWindowStore")
            RateLimiterStore<FixedWindowState> fixedWindowStore,
            @Qualifier("tokenBucketStore")
            RateLimiterStore<TokenBucketState> tokenBucketStore,
            @Qualifier("leakyBucketStore")
            RateLimiterStore<LeakyBucketState> leakyBucketStore,
            @Qualifier("slidingWindowCounterStore")
            RateLimiterStore<SlidingWindowCounterState[]> slidingWindowCounterStore,
            @Qualifier("slidingWindowLogStore")
            RateLimiterStore<Deque<Long>> slidingWindowLogStore
    ) {
        this.fixedWindowStore = fixedWindowStore;
        this.tokenBucketStore = tokenBucketStore;
        this.leakyBucketStore = leakyBucketStore;
        this.slidingWindowCounterStore = slidingWindowCounterStore;
        this.slidingWindowLogStore = slidingWindowLogStore;
    }

    public RateLimiter createRateLimiter(RateLimiterInitRequest request) {

        RateLimiterAlgoType algorithm = request.getAlgorithm();

        if (algorithm == null) {
            throw new IllegalArgumentException("algorithm is required");
        }

        return switch (algorithm) {

            case FIXED_WINDOW -> {
                if (request.getMaxRequests() <= 0 || request.getWindowSize() <= 0) {
                    throw new IllegalArgumentException("Invalid Fixed Window config");
                }
                validate(request.getMaxRequests(), "maxRequests");
                validate(request.getWindowSize(), "windowSize");

                yield new FixedWindowRateLimiter(
                        new FixedWindowConfig(
                                request.getMaxRequests(),
                                request.getWindowSize()
                        ),
                        fixedWindowStore
                );
            }

            case TOKEN_BUCKET -> {
                if (request.getBucketCapacity() <= 0 || request.getRefillRate() <= 0.0) {
                    System.out.println(request.getBucketCapacity() + " " + request.getRefillRate());
                    throw new IllegalArgumentException("Invalid Token Bucket config");
                }
                validate(request.getBucketCapacity(), "bucketCapacity");
                validate(request.getRefillRate(), "refillRate");

                yield new TokenBucketRateLimiter(
                        new TokenBucketConfig(
                                request.getBucketCapacity(),
                                request.getRefillRate()
                        ),
                        tokenBucketStore
                );
            }

            case SLIDING_WINDOW_LOG -> {
                if (request.getMaxRequests() <= 0 || request.getWindowSize() <= 0) {
                    throw new IllegalArgumentException("Invalid Sliding Window Log config");
                }
                validate(request.getMaxRequests(), "maxRequests");
                validate(request.getWindowSize(), "windowSize");

                yield new SlidingWindowLogRateLimiter(
                        new SlidingWindowConfig(
                                request.getMaxRequests(),
                                request.getWindowSize()
                        ),
                        slidingWindowLogStore
                );
            }

            case SLIDING_WINDOW_COUNTER -> {
                if (request.getMaxRequests() <= 0 || request.getWindowSize() <= 0) {
                    throw new IllegalArgumentException("Invalid Sliding Window Counter config");
                }
                validate(request.getMaxRequests(), "maxRequests");
                validate(request.getWindowSize(), "windowSize");

                yield new SlidingWindowCounterRateLimiter(
                        new SlidingWindowConfig(
                                request.getMaxRequests(),
                                request.getWindowSize()
                        ),
                        slidingWindowCounterStore
                );
            }

            case LEAKY_BUCKET -> {
                if (request.getBucketCapacity() <= 0 || request.getLeakRate() <= 0) {
                    throw new IllegalArgumentException("Invalid Leaky Bucket config");
                }
                validate(request.getBucketCapacity(), "bucketCapacity");
                validate(request.getLeakRate(), "leakRate");

                yield new LeakyBucketRateLimiter(
                        new LeakyBucketConfig(
                                request.getBucketCapacity(),
                                request.getLeakRate()
                        ),
                        leakyBucketStore
                );
            }
        };
    }

    private void validate(Object value, String fieldName) {
        if (value == null) {
            throw new IllegalArgumentException(fieldName + " is required");
        }
    }
}