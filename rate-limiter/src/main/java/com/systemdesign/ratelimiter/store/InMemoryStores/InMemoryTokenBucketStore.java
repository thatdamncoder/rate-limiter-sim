package com.systemdesign.ratelimiter.store.InMemoryStores;

import org.springframework.stereotype.Component;

@Component("tokenBucketStore")
public class InMemoryTokenBucketStore<T> extends InMemoryStore<T> {

}
