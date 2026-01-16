package com.systemdesign.ratelimiter.dto;

import com.systemdesign.ratelimiter.enums.RateLimiterAlgoType;

public class RateLimiterInitRequest {

    private RateLimiterAlgoType algorithm;

    // fixed window / sliding window
    private Integer maxRequests;
    private Long windowSize;

    //buckets
    private Integer bucketCapacity;

    // token bucket
    private Double refillRate;

    // leaky bucket
    private Integer leakRate;

    public RateLimiterAlgoType getAlgorithm() {
        return algorithm;
    }

    public void setAlgorithm(RateLimiterAlgoType algorithm) {
        this.algorithm = algorithm;
    }

    public Integer getMaxRequests() {
        return maxRequests;
    }

    public void setMaxRequests(Integer maxRequests) {
        this.maxRequests = maxRequests;
    }

    public Long getWindowSize() {
        return windowSize;
    }

    public void setWindowSize(Long windowSize) {
        this.windowSize = windowSize;
    }

    public Integer getBucketCapacity() {
        return bucketCapacity;
    }

    public void setBucketCapacity(Integer bucketCapacity) {
        this.bucketCapacity = bucketCapacity;
    }

    public Double getRefillRate() {
        return refillRate;
    }

    public void setRefillRate(Double refillRate) {
        this.refillRate = refillRate;
    }

    public Integer getLeakRate() {
        return leakRate;
    }

    public void setLeakRate(Integer leakRate) {
        this.leakRate = leakRate;
    }
}
