import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';
import { AlgorithmConfig } from '@/types/rateLimiter';
import { Separator } from '@/components/ui/separator';

interface RequestBlock {
    id: string;
    timestamp: number;
    accepted: boolean;
}

interface SlidingWindowVizProps {
    timestamps: number[];
    config: AlgorithmConfig;
}

const NOW_POSITION = 75;
const WINDOW_VERTICAL_PADDING = 32;
// const WINDOW_HEIGHT = 80;

export function SlidingWindowViz({ timestamps, config }: SlidingWindowVizProps) {
    const [now, setNow] = useState(Date.now());
    const [requests, setRequests] = useState<RequestBlock[]>([]);
    const [shake, setShake] = useState(false);
    const prevLen = useRef(timestamps.length);

    /* ---------- Time ticker ---------- */
    useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), 50);
        return () => clearInterval(id);
    }, []);

    /* ---------- Accepted requests ---------- */
    useEffect(() => {
        if (timestamps.length > prevLen.current) {
            const ts = timestamps[timestamps.length - 1];
            setRequests(r => [
                ...r,
                { id: `${ts}-${Math.random()}`, timestamp: ts, accepted: true }
            ]);
        }
        prevLen.current = timestamps.length;
    }, [timestamps]);

    /* ---------- Rejected requests ---------- */
    useEffect(() => {
        const handler = () => {
            setRequests(r => [
                ...r,
                { id: `${Date.now()}-${Math.random()}`, timestamp: Date.now(), accepted: false }
            ]);
            setShake(true);
            setTimeout(() => setShake(false), 400);
        };
        window.addEventListener('request-rejected-sliding-log', handler);
        return () =>
            window.removeEventListener('request-rejected-sliding-log', handler);
    }, []);

    /* ---------- Cleanup ---------- */
    useEffect(() => {
        const maxAge = config.windowSize * 4 * 1000;
        setRequests(r => r.filter(x => now - x.timestamp < maxAge));
    }, [now, config.windowSize]);

    /* ---------- Math (MATCHES COUNTER) ---------- */
    const windowMs = config.windowSize * 1000;
    const timelineSpanMs = windowMs * 4;
    const percentPerMs = NOW_POSITION / timelineSpanMs;

    const windowStart = now - windowMs;

    const requestsInWindow = requests.filter(
        r => r.accepted && r.timestamp >= windowStart
    ).length;

    const remaining = Math.max(0, config.maxRequests - requestsInWindow);
    const isAtLimit = requestsInWindow >= config.maxRequests;

    const toPosition = (timestamp: number) =>
        NOW_POSITION - (now - timestamp) * percentPerMs;

    return (
        <motion.div
            className="h-full flex flex-col"
            animate={shake ? { x: [-8, 8, -8, 8, 0] } : {}}
            transition={{ duration: 0.35 }}
        >
            {/* ---------- Header ---------- */}
            <div className="text-center mb-4 pt-2">
                <h3 className="text-lg font-semibold">Sliding Window Log</h3>
                <p className="text-sm text-muted-foreground/70">
                    Continuous window • {config.maxRequests} per {config.windowSize}s
                </p>
            </div>

            <Separator className="mb-6" />

            {/* ---------- Timeline ---------- */}
            <div className="relative h-48 max-w-4xl mx-auto w-full bg-secondary/30 rounded-xl border-2 border-border/60 overflow-hidden">

                {/* Background window blocks (same as counter)
        {[-2, -1, 0, 1, 2].map(offset => {
          const blockStart = now - offset * windowMs;
          const age = now - blockStart;
          const left = toPosition(blockStart);
          const width = (windowMs / 1000) * (percentPerMs * 1000);

          if (left + width < -10 || left > 110) return null;

          return (
            <div
              key={offset}
              className="absolute bg-secondary/50 rounded-lg border-2 border-border/40"
              style={{
                left: `${left}%`,
                width: `${width}%`,
                top: WINDOW_VERTICAL_PADDING,
                bottom: WINDOW_VERTICAL_PADDING,
              }}
            />
          );
        })} */}

                {/* Active sliding window */}
                <div
                    className="absolute border-4 border-dashed border-primary/70 bg-primary/10 rounded-lg z-10"
                    style={{
                        left: `${NOW_POSITION - (windowMs / 1000) * (percentPerMs * 1000)}%`,
                        width: `${(windowMs / 1000) * (percentPerMs * 1000)}%`,
                        top: WINDOW_VERTICAL_PADDING - 4,
                        bottom: WINDOW_VERTICAL_PADDING - 4,
                    }}
                >
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-3 py-1 bg-background border-2 border-primary/40 rounded-md text-sm font-mono font-bold text-primary">
                        {requestsInWindow} hits
                    </div>
                </div>

                {/* Requests (aligned with counter dots) */}
                <AnimatePresence>
                    {requests.map(req => {
                        const x = toPosition(req.timestamp);
                        if (x < -5 || x > 105) return null;

                        const inWindow = req.timestamp >= windowStart;

                        return (
                            <motion.div
                                key={req.id}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className={`absolute w-4 h-4 rounded-sm
                  ${req.accepted
                                        ? inWindow
                                            ? 'bg-success/80 glow-success'
                                            : 'bg-success/40'
                                        : inWindow
                                            ? 'bg-destructive/80 glow-destructive'
                                            : 'bg-destructive/40'
                                    }`}
                                style={{
                                    left: `${x}%`,
                                    top: '50%',
                                    transform: 'translate(-50%, -50%)',
                                }}
                            />
                        );
                    })}
                </AnimatePresence>

                {/* NOW marker */}
                <div className="absolute top-0 bottom-0 w-1 bg-primary shadow-lg shadow-primary/50 z-20" style={{ left: '75%' }} /> </div>

            <Separator className="my-8" />

            {/* ---------- Stats ---------- */}
            <div className="grid grid-cols-3 gap-6 max-w-4xl mx-auto w-full">
                <Stat label="In Window" value={`${requestsInWindow}/${config.maxRequests}`} danger={isAtLimit} />
                <Stat label="Remaining" value={remaining} danger={remaining <= 0} />
                <Stat label="Window Size" value={`${config.windowSize}s`} />
            </div>

        </motion.div>
    );
}

/* ---------- Stat ---------- */
function Stat({ label, value, danger = false }: any) {
    return (
        <div className="text-center p-4 bg-secondary/20 rounded-lg border border-border/30">
            <div className={`text-3xl font-mono font-bold ${danger ? 'text-destructive' : ''}`}>
                {value}
            </div>
            <div className="text-xs text-muted-foreground/60 mt-1 uppercase tracking-tight">
                {label}
            </div>
        </div>
    );
}
