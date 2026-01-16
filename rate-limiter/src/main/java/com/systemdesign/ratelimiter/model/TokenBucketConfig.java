package com.systemdesign.ratelimiter.model;

public record TokenBucketConfig(
        int capacity,
        double refillRatePerSecond
        //refillRatePerSecond- no of tokens refilled every second, not after how many seconds a token is refilled
){}
