package com.systemdesign.ratelimiter.store.InMemoryStores;

import org.springframework.stereotype.Component;

@Component("leakyBucketStore")
public class InMemoryLeakyBucketStore<T> extends InMemoryStore<T> {
}
