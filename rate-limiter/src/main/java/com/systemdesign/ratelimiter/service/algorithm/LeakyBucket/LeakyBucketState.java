package com.systemdesign.ratelimiter.service.algorithm.LeakyBucket;

public record LeakyBucketState(
        double currentWater,
        long lastLeakTimeInMillis
){}

