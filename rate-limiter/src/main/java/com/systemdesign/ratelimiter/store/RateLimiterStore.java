package com.systemdesign.ratelimiter.store;

import org.springframework.stereotype.Component;

import java.util.function.BiFunction;

@Component
public interface RateLimiterStore<T> {
    T compute(String key, BiFunction<String, T, T> remappingFunction);
    void reset();
}
