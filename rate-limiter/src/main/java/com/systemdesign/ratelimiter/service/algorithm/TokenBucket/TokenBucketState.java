package com.systemdesign.ratelimiter.service.algorithm.TokenBucket;

public record TokenBucketState (
    double tokens,
    long lastRefillTimeMillis
){ }
