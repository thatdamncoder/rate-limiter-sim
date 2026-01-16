import { useState, useCallback, useRef, useEffect } from 'react';
import { AlgorithmType, AlgorithmConfig, RequestLog, WindowSlot, Token, QueuedRequest } from '@/types/rateLimiter';
import {
  hitRateLimiter,
  HitResponse,
  FixedWindowMetadata,
  SlidingWindowLogMetadata,
  SlidingWindowCounterMetadata,
  TokenBucketMetadata,
  LeakyBucketMetadata
} from '@/services/rateLimiterApi';

const generateId = () => Math.random().toString(36).substring(2, 9);

export function useRateLimiter(algorithm: AlgorithmType, config: AlgorithmConfig) {
  const [logs, setLogs] = useState<RequestLog[]>([]);
  const [stats, setStats] = useState({ accepted: 0, rejected: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const requestInFlight = useRef(false);

  // Fixed Window state
  const [fixedWindowCount, setFixedWindowCount] = useState(0);
  const [currentWindowStart, setCurrentWindowStart] = useState(Date.now());

  // Sliding Window Log state
  const [requestTimestamps, setRequestTimestamps] = useState<number[]>([]);

  // Sliding Window Counter state
  const [windowSlots, setWindowSlots] = useState<WindowSlot[]>([]);
  const [slidingWindowCounterMetadata, setSlidingWindowCounterMetadata] = useState({
      currentCount: 0,
      prevCount: 0,
      windowStart: Date.now()
  });

  // Token Bucket state
  const [tokens, setTokens] = useState<Token[]>([]);
  const lastRefillTime = useRef(Date.now());

  // Leaky Bucket state
  const [queue, setQueue] = useState<QueuedRequest[]>([]);
  const lastLeakTime = useRef(Date.now());
  const prevWindowStartRef = useRef<number | null>(null);
  const [visualWindowStart, setVisualWindowStart] = useState(currentWindowStart);


useEffect(() => {
  if (algorithm !== 'fixed-window') return;

  const interval = setInterval(() => {
    const now = Date.now();
    const windowMs = config.windowSize * 1000;

    setVisualWindowStart(prev => {
      if (now - prev >= windowMs) {
        return prev + windowMs;
      }
      return prev;
    });
  }, 100);

  return () => clearInterval(interval);
}, [algorithm, config.windowSize]);
  // Initialize tokens for token bucket
  useEffect(() => {
    if (algorithm === 'token-bucket') {
      setTokens(
        Array.from({ length: config.bucketCapacity }, () => ({
          id: generateId(),
          consumed: false,
        }))
      );
    }
  }, [algorithm, config.bucketCapacity]);


  // Token refill effect (for visualization only - backend handles actual logic)
  useEffect(() => {
    if (algorithm !== 'token-bucket') return;

    // refillRate = tokens per second
    const refillIntervalMs = 1000 / config.refillRate;

    const interval = setInterval(() => {
      setTokens(prev => {
        const consumedIndex = prev.findIndex(t => t.consumed);
        if (consumedIndex === -1) return prev; // bucket full

        const updated = [...prev];
        updated[consumedIndex] = {
          id: generateId(),
          consumed: false,
        };

        return updated;
      });
    }, refillIntervalMs);

    return () => clearInterval(interval);
  }, [algorithm, config.refillRate]);


  // Leaky bucket leak effect (for visualization only - backend handles actual logic)
  useEffect(() => {
    if (algorithm !== 'leaky-bucket') return;

    const leakIntervalMs = config.leakRate * 1000; // Convert seconds to milliseconds

    const interval = setInterval(() => {
      setQueue(prev => {
        if (prev.length === 0) return prev;
        return prev.slice(1); // Remove one request at a time
      });
    }, leakIntervalMs);

    return () => clearInterval(interval);
  }, [algorithm, config.leakRate]);

  // Update window for fixed window - sync with backend window boundaries
//   useEffect(() => {
//     if (algorithm !== 'fixed-window') return;
//
//     const interval = setInterval(() => {
//       const now = Date.now();
//       const windowMs = config.windowSize * 1000;
//       const expectedWindowStart = Math.floor(now / windowMs) * windowMs;
//
//       if (expectedWindowStart > currentWindowStart) {
//         setCurrentWindowStart(expectedWindowStart);
//         setFixedWindowCount(0);
//       }
//     }, 100);
//
//     return () => clearInterval(interval);
//   }, [algorithm, config.windowSize, currentWindowStart]);

// useEffect(() => {
//   if (algorithm !== 'fixed-window') return;
//
//   if (
//     prevWindowStartRef.current !== null &&
//     prevWindowStartRef.current !== currentWindowStart
//   ) {
//     window.dispatchEvent(
//       new CustomEvent('fixed-window-reset')
//     );
//   }
//   prevWindowStartRef.current = currentWindowStart;
// }, [currentWindowStart, algorithm]);
  // Clean old timestamps for sliding window log
  useEffect(() => {
    if (algorithm !== 'sliding-window-log') return;

    const interval = setInterval(() => {
      const now = Date.now();
      setRequestTimestamps(prev => prev.filter(t => now - t < config.windowSize * 1000));
    }, 100);

    return () => clearInterval(interval);
  }, [algorithm, config.windowSize]);

  const addLog = useCallback((accepted: boolean, details: string) => {
    const log: RequestLog = {
      id: generateId(),
      timestamp: Date.now(),
      accepted,
      algorithm,
      details,
    };
    setLogs(prev => [log, ...prev].slice(0, 50));
    setStats(prev => ({
      accepted: prev.accepted + (accepted ? 1 : 0),
      rejected: prev.rejected + (accepted ? 0 : 1),
    }));
  }, [algorithm]);

useEffect(() => {
  setVisualWindowStart(currentWindowStart);
}, [currentWindowStart]);

  const updateVisualizationState = useCallback((accepted: boolean, response: HitResponse) => {
    const now = response.timestamp || Date.now();
    const metadata = response.metadata;

    switch (algorithm) {
      case 'fixed-window': {
        const fixedMeta = metadata as FixedWindowMetadata;

        if (fixedMeta) {
          setFixedWindowCount(fixedMeta.currentCount);
          setCurrentWindowStart(fixedMeta.windowStart);
        }

        if (!accepted) {
          window.dispatchEvent(
            new CustomEvent('request-rejected-fixed-window')
          );
        }

        break;
      }

      case 'sliding-window-log': {
        if (accepted) {
          setRequestTimestamps(prev => [...prev, now]);
        } else {
          window.dispatchEvent(new CustomEvent('request-rejected-sliding-log'));
        }
        break;
      }

      case 'sliding-window-counter': {
        const slidingCounterMeta = metadata as SlidingWindowCounterMetadata;
        if(slidingCounterMeta){
            setSlidingWindowCounterMetadata({
                  currentCount: slidingCounterMeta.currentWindowCount,
                  prevCount: slidingCounterMeta.previousWindowCount,
                  windowStart: slidingCounterMeta.windowStartInMillis
                });
       }
        if (accepted && slidingCounterMeta) {
          const windowStart = slidingCounterMeta.windowStartInMillis;
          const windowEnd = slidingCounterMeta.windowEndInMillis;
          setWindowSlots(prev => {
            const windowMs = config.windowSize * 1000;
            const prevWindowStart = windowStart - windowMs;
            const updated = prev.filter(s => s.start >= prevWindowStart);
            const existingSlot = updated.find(s => s.start === windowStart);

            if (existingSlot) {
              existingSlot.requests.push({ timestamp: now, accepted: true });
              return [...updated];
            }

            return [...updated, {
              start: windowStart,
              end: windowEnd,
              requests: [{ timestamp: now, accepted: true }],
            }];
          });
        } else if (!accepted) {
          window.dispatchEvent(new CustomEvent('request-rejected-sliding-counter'));
        }
        break;
      }

      case 'token-bucket': {
        if (accepted) {
          setTokens(prev => {
            const idx = prev.findIndex(t => !t.consumed);
            if (idx === -1) return prev;

            const updated = [...prev];
            updated[idx] = { ...updated[idx], consumed: true };
            return updated;
          });
        } else {
          window.dispatchEvent(new CustomEvent('request-rejected-token-bucket'));
        }
        break;
      }


      case 'leaky-bucket': {
        const leakyMeta = metadata as LeakyBucketMetadata;
        if (accepted && leakyMeta) {
          const newRequest: QueuedRequest = {
            id: generateId(),
            timestamp: now,
            processing: false,
          };
          setQueue(prev => {
            const newQueue = [...prev, newRequest];
            return newQueue.slice(-leakyMeta.queueSize);
          });
        } else if (!accepted) {
          window.dispatchEvent(new CustomEvent('request-rejected-leaky-bucket'));
        }
        break;
      }
    }
  }, [algorithm, config.windowSize]);

  const makeRequest = useCallback(async (): Promise<boolean> => {
    if (isLoading) return false;

    setIsLoading(true);
    requestInFlight.current = true;

    try {
      const response = await hitRateLimiter();
      const accepted = response.accepted;

      // Update visualization state based on response
      updateVisualizationState(accepted, response);

      // Add log entry with message from backend
      addLog(accepted, response.message);

      return accepted;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addLog(false, `API Error: ${errorMessage}`);
      return false;
    } finally {
      setIsLoading(false);
      // Small delay to ensure state updates complete before allowing refills
      setTimeout(() => {
        requestInFlight.current = false;
      }, 100);
    }
  }, [isLoading, updateVisualizationState, addLog]);

  const reset = useCallback(() => {
    setLogs([]);
    setStats({ accepted: 0, rejected: 0 });
    setFixedWindowCount(0);
    setCurrentWindowStart(Date.now());
    setRequestTimestamps([]);
    setWindowSlots([]);
    setTokens(Array.from({ length: config.bucketCapacity }, () => ({
      id: generateId(),
      consumed: false,
    })));
    setQueue([]);
    lastRefillTime.current = Date.now();
    lastLeakTime.current = Date.now();
    window.dispatchEvent(new Event('rate-limiter-reset'));
  }, [config.bucketCapacity]);

  return {
    makeRequest,
    reset,
    logs,
    stats,
    isLoading,
    // State for visualizations
    fixedWindowCount,
    currentWindowStart,
    requestTimestamps,
    windowSlots,
    tokens,
    queue,
    slidingWindowCounterMetadata
  };
}