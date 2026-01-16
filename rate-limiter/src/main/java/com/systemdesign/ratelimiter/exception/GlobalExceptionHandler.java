package com.systemdesign.ratelimiter.exception;

import com.systemdesign.ratelimiter.dto.RateLimiterInitResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<RateLimiterInitResponse> handleIllegalArgument(
            IllegalArgumentException ex
    ) {
        return ResponseEntity.badRequest().body(
                new RateLimiterInitResponse(
                        false,
                        ex.getMessage(),
                        null
                )
        );
    }
}
