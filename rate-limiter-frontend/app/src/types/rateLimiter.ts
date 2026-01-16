export type AlgorithmType = 
  | 'fixed-window'
  | 'sliding-window-log'
  | 'sliding-window-counter'
  | 'token-bucket'
  | 'leaky-bucket';

export interface AlgorithmConfig {
  maxRequests: number;
  windowSize: number; // in seconds
  refillRate: ; // tokens per second for token bucket
  bucketCapacity: number; // for token bucket
  leakRate: number; // requests per second for leaky bucket
}

export interface RequestLog {
  id: string;
  timestamp: number;
  accepted: boolean;
  algorithm: AlgorithmType;
  details: string;
}

export interface WindowSlot {
  start: number;
  end: number;
  requests: { timestamp: number; accepted: boolean }[];
}

export interface Token {
  id: string;
  consumed: boolean;
}

export interface QueuedRequest {
  id: string;
  timestamp: number;
  processing: boolean;
}