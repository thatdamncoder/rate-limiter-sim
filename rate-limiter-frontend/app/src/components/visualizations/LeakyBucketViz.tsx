import { motion, AnimatePresence } from 'framer-motion';
import { QueuedRequest, AlgorithmConfig } from '@/types/rateLimiter';
import { Droplets } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useState, useEffect } from 'react';

interface LeakyBucketVizProps {
    queue: QueuedRequest[];
    config: AlgorithmConfig;
}

export function LeakyBucketViz({ queue, config }: LeakyBucketVizProps) {
    const [shake, setShake] = useState(false);
    const fillPercentage = (queue.length / config.bucketCapacity) * 100;
    const isAtLimit = queue.length >= config.bucketCapacity;
    const remaining = Math.max(0, config.bucketCapacity - queue.length);

    useEffect(() => {
        const handleRejected = () => {
            setShake(true);
            setTimeout(() => setShake(false), 500);
        };

        window.addEventListener('request-rejected-leaky-bucket', handleRejected);
        return () => window.removeEventListener('request-rejected-leaky-bucket', handleRejected);
    }, []);

    return (
        <motion.div
            className="h-full flex flex-col"
            animate={shake ? { x: [-10, 10, -10, 10, 0] } : {}}
            transition={{ duration: 0.4 }}
        >
            <div className="text-center mb-4 pt-2">
                <h3 className="text-lg font-semibold text-foreground">Leaky Bucket</h3>
                <p className="text-sm text-muted-foreground/70">
                    Requests leak at {config.leakRate}/s • Capacity {config.bucketCapacity}
                </p>
            </div>

            <Separator className="mb-6 bg-border/50" />

            <div className="flex-1 flex flex-col items-center justify-center">
                <div className="relative">
                    {/* Bucket with leak */}
                    <div className="relative w-48 h-56">
                        {/* Bucket container */}
                        <div
                            className="absolute inset-0 bg-secondary/30 border-2 border-border/40 rounded-b-3xl overflow-hidden"
                            style={{
                                clipPath: 'polygon(10% 0%, 90% 0%, 100% 100%, 0% 100%)',
                            }}
                        >
                            {/* Queue level */}
                            <motion.div
                                className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-warning/50 to-warning/20"
                                animate={{ height: `${fillPercentage}%` }}
                                transition={{ type: 'spring', stiffness: 100, damping: 15 }}
                            />
                        </div>

                        {/* Requests in queue */}
                        <div className="absolute inset-0 flex flex-col-reverse items-center justify-start pb-4 pt-8 px-4 overflow-hidden">
                            <AnimatePresence>
                                {queue.map((req, index) => (
                                    <motion.div
                                        key={req.id}
                                        layout
                                        initial={{ y: -50, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        exit={{
                                            y: 100,
                                            opacity: 0,
                                            scale: 0.5,
                                            transition: { duration: 0.3 }
                                        }}
                                        className="w-8 h-8 mb-1 rounded-full bg-success/60 glow-success flex items-center justify-center"
                                    >
                                        <span className="text-xs font-mono text-success-foreground/80">{index + 1}</span>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>

                        {/* Leak hole at bottom */}
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-background rounded-full border-2 border-border/40" />

                        {/* Leaking drops animation - speed based on leak rate */}
                        <AnimatePresence>
                            {queue.length > 0 && (
                                <motion.div
                                    className="absolute -bottom-12 left-1/2 -translate-x-1/2"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                >
                                    {[...Array(3)].map((_, i) => (
                                        <motion.div
                                            key={i}
                                            className="absolute"
                                            initial={{ y: 0, opacity: 1 }}
                                            animate={{ y: 30, opacity: 0 }}
                                            transition={{
                                                duration: 1 / config.leakRate,
                                                repeat: Infinity,
                                                delay: i * (0.3 / config.leakRate),
                                                ease: 'easeIn'
                                            }}
                                        >
                                            <Droplets size={12} className="text-success/60" />
                                        </motion.div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Processed requests visualization */}
                    <div className="mt-8 flex items-center justify-center">
                        <div className="flex items-center gap-2 px-4 py-2 bg-success/10 rounded-full border border-success/30">
                            <motion.div
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 1 / config.leakRate, repeat: Infinity }}
                            >
                                <Droplets className="w-4 h-4 text-success/60" />
                            </motion.div>
                            <span className="text-sm font-mono text-success/70">Processing at {config.leakRate}/s</span>
                        </div>
                    </div>
                </div>

                <Separator className="my-6 w-64 bg-border/50" />

                {/* Stats */}
                <div className="flex gap-8">
                    <div className="text-center p-3 bg-secondary/20 rounded-lg border border-border/30 min-w-[80px]">
                        <div className={`text-2xl font-bold font-mono ${isAtLimit ? 'text-destructive/80' : 'text-foreground'}`}>
                            {queue.length}
                        </div>
                        <div className="text-xs text-muted-foreground/60">In Queue</div>
                    </div>
                    <div className="text-center p-3 bg-secondary/20 rounded-lg border border-border/30 min-w-[80px]">
                        <div className="text-2xl font-bold font-mono text-primary/80">{config.bucketCapacity}</div>
                        <div className="text-xs text-muted-foreground/60">Capacity</div>
                    </div>
                    <div className="text-center p-3 bg-secondary/20 rounded-lg border border-border/30 min-w-[80px]">
                        <div className={`text-2xl font-bold font-mono ${remaining <= 0 ? 'text-destructive/80' : 'text-success/80'}`}>
                            {remaining}
                        </div>
                        <div className="text-xs text-muted-foreground/60">Available</div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}