package com.systemdesign.ratelimiter.controller;

import com.systemdesign.ratelimiter.dto.RateLimiterHitResponse;
import com.systemdesign.ratelimiter.dto.RateLimiterInitRequest;
import com.systemdesign.ratelimiter.dto.RateLimiterInitResponse;
import com.systemdesign.ratelimiter.service.factory.RateLimiterFactory;
import com.systemdesign.ratelimiter.service.algorithm.RateLimiter;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "http://localhost:3000")
@RestController
@RequestMapping("/api")
public class RateLimiterController {

    // NOTE: single limiter for demo / visualizer
    private volatile RateLimiter rateLimiter;
    private final RateLimiterFactory factory;

    public RateLimiterController(RateLimiterFactory factory) {
        this.factory = factory;
    }

    @PostMapping("/init")
    public ResponseEntity<?> initLimiter(
            @RequestBody RateLimiterInitRequest request
    ){
        try{
            System.out.println(request.getRefillRate());
            this.rateLimiter = factory.createRateLimiter(request);
        } catch (Exception e) {
            System.out.println(e.getMessage());
            throw new RuntimeException(e);
        }

        System.out.println(request.getRefillRate() + " " + request.getBucketCapacity());
        return ResponseEntity.ok(
                new RateLimiterInitResponse(
                        true,
                        "Rate limiter initialized",
                        request.getAlgorithm()
                )
        );
    }

    // STEP 2: Fire request
    @GetMapping("/hit")
    //ResponseEntity<RateLimiterHitResponse>
    public ResponseEntity<?> hit(HttpServletRequest httpRequest) {

        if (rateLimiter == null) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(new RateLimiterHitResponse(
                            false,
                            "Rate limiter not initialized",
                            System.currentTimeMillis(),
                            0,
                            0,
                            null
                    ));
        }

        String clientId = httpRequest.getRemoteAddr();
        RateLimiterHitResponse response = rateLimiter.hitEndpoint(clientId);

        HttpStatus status = response.accepted()
                ? HttpStatus.OK
                : HttpStatus.TOO_MANY_REQUESTS;

        return ResponseEntity.status(status).body(response);
    }

    @PostMapping("/reset")
    public ResponseEntity<?> resetLimiter() {

        if (rateLimiter == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }

        rateLimiter.reset();
        return ResponseEntity.ok().build();
    }
}
