package com.systemdesign.ratelimiter.model;

public record LeakyBucketConfig (
        int bucketCapacity,
        double leakRateInSec
){}
