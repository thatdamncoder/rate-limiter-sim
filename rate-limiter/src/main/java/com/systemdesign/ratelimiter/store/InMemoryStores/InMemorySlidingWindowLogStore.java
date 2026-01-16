package com.systemdesign.ratelimiter.store.InMemoryStores;

import org.springframework.stereotype.Component;

@Component("slidingWindowLogStore")
public class InMemorySlidingWindowLogStore <T> extends InMemoryStore<T> {
}
