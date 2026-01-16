package com.systemdesign.ratelimiter.service.algorithm.SlidingWindow.SlidingWindowCounter;

public record SlidingWindowCounterState(
        int count,
        long windowStartInMillis
){}
