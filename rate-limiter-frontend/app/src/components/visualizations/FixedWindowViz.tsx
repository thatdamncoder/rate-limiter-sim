import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';
import { AlgorithmConfig } from '@/types/rateLimiter';
import { Separator } from '@/components/ui/separator';

interface RequestDot {
    id: string;
    timestamp: number;
    accepted: boolean;
    windowStart: number;
}

interface WindowBlock {
    id: string;
    start: number;
    end: number;
}

interface FixedWindowVizProps {
    count: number;
    windowStart: number;
    config: AlgorithmConfig;
}

const WINDOW_HEIGHT = 120; // Increased from 80 to match SlidingCounterViz
const LINE_THICKNESS = 3;

export function FixedWindowViz({ count, windowStart, config }: FixedWindowVizProps) {
    const [now, setNow] = useState(Date.now());
    const [requests, setRequests] = useState<RequestDot[]>([]);
    const [windows, setWindows] = useState<WindowBlock[]>([]);
    const [shake, setShake] = useState(false);

    const prevCountRef = useRef(count);
    const prevWindowStartRef = useRef(windowStart);

    /* ---------------- Time ticker ---------------- */
    useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), 50);
        return () => clearInterval(id);
    }, []);

    /* ---------------- Window creation ---------------- */
    useEffect(() => {
        if (windowStart !== prevWindowStartRef.current) {
            const windowMs = config.windowSize * 1000;

            setWindows(prev => [
                ...prev,
                {
                    id: `window-${windowStart}`,
                    start: windowStart,
                    end: windowStart + windowMs,
                },
            ]);

            if (count > 0) {
                setRequests(prev => [
                    ...prev,
                    {
                        id: `first-${windowStart}-${Math.random()}`,
                        timestamp: Date.now(),
                        accepted: true,
                        windowStart,
                    },
                ]);
            }
        }
        prevWindowStartRef.current = windowStart;
    }, [windowStart, count, config.windowSize]);

    /* ---------------- New requests ---------------- */
    useEffect(() => {
        if (count > prevCountRef.current && windowStart === prevWindowStartRef.current) {
            setRequests(prev => [
                ...prev,
                {
                    id: `${Date.now()}-${Math.random()}`,
                    timestamp: Date.now(),
                    accepted: true,
                    windowStart,
                },
            ]);
        }
        prevCountRef.current = count;
    }, [count, windowStart]);

    /* ---------------- Rejected requests ---------------- */
    useEffect(() => {
        const handler = () => {
            setRequests(prev => [
                ...prev,
                {
                    id: `${Date.now()}-${Math.random()}`,
                    timestamp: Date.now(),
                    accepted: false,
                    windowStart,
                },
            ]);
            setShake(true);
            setTimeout(() => setShake(false), 400);
        };

        window.addEventListener('request-rejected-fixed-window', handler);
        return () => window.removeEventListener('request-rejected-fixed-window', handler);
    }, [windowStart]);

    /* ---------------- Reset handling ---------------- */
    useEffect(() => {
        if (count === 0) {
            setWindows([]);
            setRequests([]);
        }
    }, [count]);

    /* ---------------- Timeline math ---------------- */
    const windowMs = config.windowSize * 1000;
    const timelineWidth = config.windowSize * 4;
    const nowPosition = 60;
    const pixelsPerMs = nowPosition / (timelineWidth * 1000);

    /* ---------------- Cleanup offscreen ---------------- */
    useEffect(() => {
        const maxAge = timelineWidth * 1000;
        setWindows(w => w.filter(x => now - x.start < maxAge));
        setRequests(r => r.filter(x => now - x.timestamp < maxAge));
    }, [now, timelineWidth]);

    const currentWindow = windows.find(w => w.start === windowStart);
    const remainingTime =
        currentWindow ? Math.max(0, Math.ceil((currentWindow.end - now) / 1000)) : 0;

    const remaining = Math.max(0, config.maxRequests - count);
    const isAtLimit = count >= config.maxRequests;

    return (
        <motion.div
            className="h-full flex flex-col"
            animate={shake ? { x: [-10, 10, -10, 10, 0] } : {}}
            transition={{ duration: 0.4 }}
        >
            <div className="text-center mb-4 pt-2">
                <h3 className="text-lg font-semibold">Fixed Window Counter</h3>
                <p className="text-sm text-muted-foreground/70">
                    Window starts on first request • Max {config.maxRequests} per {config.windowSize}s
                </p>
            </div>

            <Separator className="mb-6 bg-border/50" />

            <div className="flex-1 flex items-center justify-center px-4">
                <div className="w-full max-w-4xl">
                    {/* Timeline - Increased height */}
                    <div className="relative h-48 mb-12">

                        {/* CENTER RAIL (Dashed Line & Dots) */}
                        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 z-20">
                            <svg width="100%" height={LINE_THICKNESS}>
                                <motion.line
                                    x1="0"
                                    y1={LINE_THICKNESS / 2}
                                    x2="100%"
                                    y2={LINE_THICKNESS / 2}
                                    stroke="currentColor"
                                    strokeWidth={LINE_THICKNESS}
                                    strokeDasharray="10 6"
                                    className="text-border"
                                    animate={{ strokeDashoffset: [-16, 0] }}
                                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                />
                            </svg>

                            <AnimatePresence>
                                {requests.map(r => {
                                    const age = now - r.timestamp;
                                    const pos = nowPosition - age * pixelsPerMs;
                                    if (pos < -5 || pos > 105) return null;

                                    return (
                                        <motion.div
                                            key={r.id}
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1, opacity: r.windowStart === windowStart ? 1 : 0.4 }}
                                            exit={{ scale: 0 }}
                                            className={`absolute w-4 h-4 rounded-sm -translate-y-1/2 ${r.accepted
                                                    ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                                                    : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]'
                                                }`}
                                            style={{ left: `${pos}%`, top: 0 }}
                                        />
                                    );
                                })}
                            </AnimatePresence>
                        </div>

                        <AnimatePresence>
                            {windows.map(w => {
                                const age = now - w.start;
                                const pos = nowPosition - age * pixelsPerMs;
                                const width = windowMs * pixelsPerMs;

                                if (pos + width < -5) return null;

                                const progress = Math.min(100, ((now - w.start) / windowMs) * 100);
                                const isCurrent = w.start === windowStart;

                                return (
                                    <motion.div
                                        key={w.id}
                                        className="absolute rounded-lg bg-primary/10 border-4 border-primary/60"
                                        style={{
                                            left: `${pos}%`,
                                            width: `${width}%`,
                                            top: '50%',
                                            height: WINDOW_HEIGHT,
                                            transform: `translateY(-${WINDOW_HEIGHT / 2}px)`,
                                        }}
                                    >
                                        {isCurrent && now < w.end && (
                                            <>
                                                <motion.div
                                                    className="absolute inset-0 bg-primary/10 rounded-lg origin-left"
                                                    style={{ width: `${progress}%` }}
                                                />
                                                <div className="absolute -top-9 left-1/2 -translate-x-1/2 px-3 py-1 bg-background border-2 border-primary/40 rounded-md text-sm font-mono font-bold text-primary whitespace-nowrap">
                                                    Current Window
                                                </div>
                                            </>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>

                        {/* "now" marker line*/}
                        <div
                            className="absolute top-1/2 w-1 bg-primary shadow-lg shadow-primary/50 -translate-y-1/2 z-30"
                            style={{ left: `${nowPosition}%`, height: `${WINDOW_HEIGHT + 16}px` }}
                        >
                            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-primary rounded-full shadow-lg shadow-primary/50" />
                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-primary rounded-full shadow-lg shadow-primary/50" />
                            <div className="absolute -top-9 left-1/2 -translate-x-1/2 text-sm font-mono font-bold text-primary whitespace-nowrap">
                                NOW
                            </div>
                        </div>

                        {/* Remaining time label for current window */}
                        {currentWindow && remainingTime > 0 && (
                            <div
                                className="absolute -bottom-10 px-3 py-1 bg-background border-2 border-border/40 rounded-md text-sm font-mono text-muted-foreground z-30"
                                style={{ left: `${nowPosition}%`, transform: 'translateX(-50%)' }}
                            >
                                {remainingTime}s left
                            </div>
                        )}
                    </div>

                    <Separator className="my-8 bg-border/50" />

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-6">
                        <div className="text-center p-5 bg-secondary/30 rounded-lg border-2 border-border/40">
                            <div className={`text-3xl font-bold font-mono ${isAtLimit ? 'text-destructive' : 'text-foreground'}`}>
                                {count}/{config.maxRequests}
                            </div>
                            <div className="text-sm text-muted-foreground/70 mt-2 font-medium">Used</div>
                        </div>
                        <div className="text-center p-5 bg-secondary/30 rounded-lg border-2 border-border/40">
                            <div className={`text-3xl font-bold font-mono ${remaining <= 0 ? 'text-destructive' : 'text-green-500'}`}>
                                {remaining}
                            </div>
                            <div className="text-sm text-muted-foreground/70 mt-2 font-medium">Remaining</div>
                        </div>
                        <div className="text-center p-5 bg-secondary/30 rounded-lg border-2 border-border/40">
                            <div className="text-3xl font-bold font-mono text-primary">
                                {windows.length > 0 ? `${remainingTime}s` : '--'}
                            </div>
                            <div className="text-sm text-muted-foreground/70 mt-2 font-medium">Time Left</div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}