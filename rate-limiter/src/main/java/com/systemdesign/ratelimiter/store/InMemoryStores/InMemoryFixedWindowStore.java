package com.systemdesign.ratelimiter.store.InMemoryStores;

import org.springframework.stereotype.Component;

@Component("fixedWindowStore")
public class InMemoryFixedWindowStore<T> extends InMemoryStore<T> {
}
