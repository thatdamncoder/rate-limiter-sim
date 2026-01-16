import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { AlgorithmConfig, WindowSlot } from '@/types/rateLimiter';
import { Separator } from '@/components/ui/separator';

interface RequestBlock {
    id: string;
    timestamp: number;
    accepted: boolean;
}

interface SlidingCounterVizProps {
    slots: WindowSlot[];
    config: AlgorithmConfig;
    backendState: {
        currentCount: number;
        prevCount: number;
        windowStart: number;
    };
}

export function SlidingCounterViz({ slots, config, backendState }: SlidingCounterVizProps) {
    const [now, setNow] = useState(Date.now());
    const [requests, setRequests] = useState<RequestBlock[]>([]);
    const [shake, setShake] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            setNow(Date.now());
        }, 50);
        return () => clearInterval(interval);
    }, []);

    // Track requests from slots
    useEffect(() => {
        setRequests(prev => {
            const existing = new Set(prev.map(r => r.timestamp));
            const merged = [...prev];

            slots.forEach(slot => {
                slot.requests.forEach(req => {
                    if (!existing.has(req.timestamp)) {
                        merged.push({
                            id: `${req.timestamp}-${Math.random()}`,
                            timestamp: req.timestamp,
                            accepted: req.accepted,
                        });
                    }
                });
            });

            return merged;
        });
    }, [slots]);

    // Listen for rejected requests
    useEffect(() => {
        const handleRejected = () => {
            setRequests(prev => [...prev, {
                id: `${Date.now()}-${Math.random()}`,
                timestamp: Date.now(),
                accepted: false,
            }]);
            setShake(true);
            setTimeout(() => setShake(false), 500);
        };

        window.addEventListener('request-rejected-sliding-counter', handleRejected);
        return () => window.removeEventListener('request-rejected-sliding-counter', handleRejected);
    }, []);

    // Listen for reset events to clear all requests
    useEffect(() => {
        const handleReset = () => {
            setRequests([]);
        };

        window.addEventListener('rate-limiter-reset', handleReset);
        return () => window.removeEventListener('rate-limiter-reset', handleReset);
    }, []);

    // Reset requests when slots are cleared (on algorithm reset)
    useEffect(() => {
        if (slots.length === 0) {
            setRequests([]);
        }
    }, [slots]);

    // Clean up old requests
    useEffect(() => {
        const maxAge = config.windowSize * 4 * 1000;
        setRequests(prev => prev.filter(r => now - r.timestamp < maxAge));
    }, [now, config.windowSize]);

    if (!config.windowSize || config.windowSize <= 0) {
        return (
            <div className="h-full flex items-center justify-center text-muted-foreground">
                Waiting for configuration…
            </div>
        );
    }

    const windowMs = config.windowSize * 1000;
    const timelineWidth = config.windowSize * 4;
    const pixelsPerSecond = 100 / timelineWidth;

    // Determine which window boundary to use for calculations
    // If backend hasn't sent an update in a while, use computed boundary
    const timeSinceBackendUpdate = now - backendState.windowStart;
    const backendWindowAge = Math.floor(timeSinceBackendUpdate / windowMs);

    // Use backend window start, but if we've crossed into new windows, adjust
    const effectiveWindowStart = backendState.windowStart + (backendWindowAge * windowMs);
    // const effectivePrevWindowStart = effectiveWindowStart - windowMs;

    const elapsedMs = now - effectiveWindowStart;
    const positionInWindow = Math.max(0, Math.min(1, elapsedMs / windowMs));

    // If we've moved to a new window that the backend hasn't reported yet,
    // the previous count becomes the old current count, and current becomes 0
    let effectiveCurrentCount = backendState.currentCount;
    let effectivePrevCount = backendState.prevCount;

    if (backendWindowAge > 0) {
        // We've moved past the backend's window
        if (backendWindowAge === 1) {
            // Just moved to next window
            effectivePrevCount = backendState.currentCount;
            effectiveCurrentCount = 0;
        } else {
            // Moved multiple windows ahead - all counts are stale
            effectivePrevCount = 0;
            effectiveCurrentCount = 0;
        }
    }

    const weightedCount = effectivePrevCount * (1 - positionInWindow) + effectiveCurrentCount;
    const remaining = Math.max(0, config.maxRequests - weightedCount);
    const isAtLimit = weightedCount >= config.maxRequests;

    // Use effective window start for visualization
    const currentWindowStart = effectiveWindowStart;

    // Filter requests that are within the sliding window AND accepted
    const slidingWindowStart = now - windowMs;
    const requestsInWindow = requests.filter(r =>
        r.accepted && r.timestamp >= slidingWindowStart && r.timestamp <= now
    );

    const NOW_POSITION = 75; // %
    const timelineSpanMs = windowMs * 4;
    const percentPerMs = NOW_POSITION / timelineSpanMs;

    // const toPosition = (timestamp: number) =>
    //     NOW_POSITION - (now - timestamp) * percentPerMs;

    return (
        <motion.div
            className="h-full flex flex-col"
            animate={shake ? { x: [-10, 10, -10, 10, 0] } : {}}
            transition={{ duration: 0.4 }}
        >
            <div className="text-center mb-4 pt-2">
                <h3 className="text-lg font-semibold text-foreground">Sliding Window Counter</h3>
                <p className="text-sm text-muted-foreground/70">
                    Weighted counting across windows • Max {config.maxRequests} per {config.windowSize}s • Showing {requestsInWindow.length} in window
                </p>
            </div>

            <Separator className="mb-6 bg-border/50" />

            <div className="flex-1 flex flex-col items-center justify-center px-2">
                <div className="w-full max-w-4xl">
                    {/* Time markers */}
                    <div className="relative h-8 mb-3">
                        {[-2, -1, 0, 1].map((offset) => {
                            const windowTime = currentWindowStart + (offset * windowMs);
                            const age = now - windowTime;
                            const position = 75 - (age / 1000) * pixelsPerSecond;

                            if (position < -5 || position > 105) return null;

                            return (
                                <div
                                    key={offset}
                                    className="absolute text-sm font-mono text-muted-foreground/70 transition-none"
                                    style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
                                >
                                    |
                                </div>
                            );
                        })}
                    </div>

                    {/* Main timeline */}
                    <div className="relative h-48 bg-secondary/30 rounded-xl border-2 border-border/60 overflow-hidden">
                        {[-2, -1, 0, 1, 2].map((offset) => {
                            const blockStart = currentWindowStart + (offset * windowMs);
                            const blockAge = now - blockStart;
                            const position = 75 - (blockAge / 1000) * pixelsPerSecond;
                            const width = (windowMs / 1000) * pixelsPerSecond;

                            if (position + width < -10 || position > 110) return null;

                            return (
                                <div
                                    key={`block-${offset}`}
                                    className="absolute top-8 bottom-8 bg-secondary/50 rounded-lg border-2 border-border/40 transition-none"
                                    style={{
                                        left: `${position}%`,
                                        width: `${width}%`,
                                    }}
                                />
                            );
                        })}

                        {/* Fixed dotted sliding window*/}
                        <div
                            className="absolute top-6 bottom-6 border-4 border-dashed border-primary/70 rounded-lg z-10 pointer-events-none bg-primary/10"
                            style={{
                                right: '25%',
                                width: `${config.windowSize * pixelsPerSecond}%`,
                            }}
                        >
                            <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-3 py-1 bg-background border-2 border-primary/40 rounded-md text-sm font-mono font-bold text-primary whitespace-nowrap">
                                ~{weightedCount.toFixed(1)} hits
                            </div>
                        </div>

                        {/* Request blocks moving through*/}
                        <AnimatePresence>
                            {requests.map((request) => {
                                const age = now - request.timestamp;
                                const position = 75 - (age / 1000) * pixelsPerSecond;

                                if (position < -5 || position > 105) return null;

                                // Check if this request is within the sliding window
                                const isInSlidingWindow = age < windowMs;

                                return (
                                    <motion.div
                                        key={request.id}
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{
                                            scale: 1,
                                            opacity: 1,
                                        }}
                                        exit={{ opacity: 0, scale: 0 }}
                                        className={`absolute w-4 h-4 rounded-sm ${request.accepted
                                                ? isInSlidingWindow
                                                    ? 'bg-success/80 glow-success'
                                                    : 'bg-success/40'
                                                : isInSlidingWindow
                                                    ? 'bg-destructive/80 glow-destructive'
                                                    : 'bg-destructive/40'
                                            }`}
                                        style={{
                                            left: `${position}%`,
                                            top: '50%',
                                            transform: 'translate(-50%, -50%)',
                                        }}
                                    />
                                );
                            })}
                        </AnimatePresence>

                        {/* Now marker*/}
                        <div className="absolute top-0 bottom-0 w-1 bg-primary shadow-lg shadow-primary/50 z-20" style={{ left: '75%' }} />
                        <div className="absolute -top-1 w-3 h-3 bg-primary rounded-full shadow-lg shadow-primary/50 z-20" style={{ left: '75%', transform: 'translateX(-50%)' }} />
                        <div className="absolute -bottom-1 w-3 h-3 bg-primary rounded-full shadow-lg shadow-primary/50 z-20" style={{ left: '75%', transform: 'translateX(-50%)' }} />
                    </div>

                    {/* Labels */}
                    <div className="relative h-8 mt-2">
                        <div className="absolute text-sm font-mono font-bold text-primary" style={{ left: '75%', transform: 'translateX(-50%)' }}>
                            NOW
                        </div>
                    </div>

                    <Separator className="my-6 bg-border/50" />

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-6">
                        <div className="text-center p-5 bg-secondary/30 rounded-lg border-2 border-border/40">
                            <div className={`text-3xl font-bold font-mono ${isAtLimit ? 'text-destructive' : 'text-foreground'}`}>
                                {weightedCount.toFixed(1)}
                            </div>
                            <div className="text-sm text-muted-foreground/70 mt-2 font-medium">Weighted Count</div>
                        </div>
                        <div className="text-center p-5 bg-secondary/30 rounded-lg border-2 border-border/40">
                            <div className="text-3xl font-bold font-mono text-primary">{config.maxRequests}</div>
                            <div className="text-sm text-muted-foreground/70 mt-2 font-medium">Max Allowed</div>
                        </div>
                        <div className="text-center p-5 bg-secondary/30 rounded-lg border-2 border-border/40">
                            <div className={`text-3xl font-bold font-mono ${remaining <= 0 ? 'text-destructive' : 'text-green-500'}`}>
                                {remaining.toFixed(1)}
                            </div>
                            <div className="text-sm text-muted-foreground/70 mt-2 font-medium">Remaining</div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}