package com.systemdesign.ratelimiter.store.InMemoryStores;

import org.springframework.stereotype.Component;

@Component("slidingWindowCounterStore")
public class InMemorySlidingWindowCounterStore<T> extends InMemoryStore<T> {
}
