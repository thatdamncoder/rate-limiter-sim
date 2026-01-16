import { AlgorithmType, AlgorithmConfig } from '@/types/rateLimiter';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

export interface InitRequest {
  algorithm: string;
  maxRequests?: number;
  windowSize?: number;
  bucketCapacity?: number;
  refillRate?: number;
  leakRate?: number;
}

export interface InitResponse {
  allowed: boolean;
  message: string;
  algorithm: string;
}

// Algorithm-specific metadata types
export interface FixedWindowMetadata {
  currentCount: number;
  maxRequests: number;
  windowStart: number;
  windowEnd: number;
}

export interface SlidingWindowCounterMetadata {
  currentWindowCount: number;
  previousWindowCount: number;
  estimatedCount: number;
  windowStartInMillis: number;
  windowEndInMillis: number;
}

export interface SlidingWindowLogMetadata {
  currentWindowSize: number;
  maxRequests: number;
  windowSizeSeconds: number;
  windowStartInMillis: number;
  windowEndInMillis: number;
}

export interface LeakyBucketMetadata {
  queueSize: number;
  capacity: number;
  leakRatePerSec: number;
}

export interface TokenBucketMetadata {
  tokensRemaining: number;
  bucketCapacity: number;
  refillRatePerSecond: number;
}

export type HitMetadata =
  | FixedWindowMetadata
  | SlidingWindowCounterMetadata
  | SlidingWindowLogMetadata
  | LeakyBucketMetadata
  | TokenBucketMetadata;

export interface HitResponse {
  accepted: boolean;
  message: string;
  timestamp: number;
  retryAfter: number;
  metadata: HitMetadata;
}

function mapAlgorithmToBackend(algorithm: AlgorithmType): string {
  const mapping: Record<AlgorithmType, string> = {
    'fixed-window': 'FIXED_WINDOW',
    'sliding-window-log': 'SLIDING_WINDOW_LOG',
    'sliding-window-counter': 'SLIDING_WINDOW_COUNTER',
    'token-bucket': 'TOKEN_BUCKET',
    'leaky-bucket': 'LEAKY_BUCKET',
  };
  return mapping[algorithm];
}

function buildInitRequest(algorithm: AlgorithmType, config: AlgorithmConfig): InitRequest {
  const request: InitRequest = {
    algorithm: mapAlgorithmToBackend(algorithm),
  };

  // Add fields based on algorithm type
  if (['fixed-window', 'sliding-window-log', 'sliding-window-counter'].includes(algorithm)) {
    request.maxRequests = config.maxRequests;
    request.windowSize = config.windowSize;
  }

  if (algorithm === 'token-bucket') {
      console.log(config.refillRate)
    request.bucketCapacity = config.bucketCapacity;
    request.refillRate = config.refillRate;
  }

  if (algorithm === 'leaky-bucket') {
    request.bucketCapacity = config.bucketCapacity;
    request.leakRate = config.leakRate;
  }

  return request;
}

export async function initRateLimiter(
  algorithm: AlgorithmType,
  config: AlgorithmConfig
): Promise<InitResponse> {
    console.log(JSON.stringify(buildInitRequest(algorithm, config)));
  const response = await fetch(`${API_BASE_URL}/init`, {  // ← Fix here
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(buildInitRequest(algorithm, config)),
  });


  if (!response.ok) {
    throw new Error(`Failed to initialize rate limiter: ${response.statusText}`);  // ← Fix here
  }

  return response.json();
}

export async function hitRateLimiter(): Promise<HitResponse> {
  const response = await fetch(`${API_BASE_URL}/hit`, {  // ← Fix here
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
    const data = await response.json();
    console.log("inside hit limiter");
    console.log(data);

  // Handle both 200 OK and 429 TOO_MANY_REQUESTS as valid responses
  if (response.status === 200 || response.status === 429) {
    return data;
  }

  if (response.status === 400) {
    throw new Error('Rate limiter not initialized');
  }

  throw new Error(`Failed to hit rate limiter: ${response.statusText}`);  // ← Fix here
}

export async function resetRateLimiter(): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/reset`, {  // ← Fix here
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to reset rate limiter: ${response.statusText}`);  // ← Fix here
  }
}