package com.systemdesign.ratelimiter.store.InMemoryStores;

import com.systemdesign.ratelimiter.store.RateLimiterStore;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.BiFunction;

public class InMemoryStore<T> implements RateLimiterStore<T> {

    protected final Map<String, T> storage = new ConcurrentHashMap<>();

    @Override
    public T compute(String key, BiFunction<String, T, T> remappingFunction) {
        return storage.compute(key, remappingFunction);
    }

    @Override
    public void reset() {
        storage.clear();
    }
}
