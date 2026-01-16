import { motion, AnimatePresence } from 'framer-motion';
import { Token, AlgorithmConfig } from '@/types/rateLimiter';
import { Droplets } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useState, useEffect } from 'react';

interface TokenBucketVizProps {
    tokens: Token[];
    config: AlgorithmConfig;
}

export function TokenBucketViz({ tokens, config }: TokenBucketVizProps) {
    const [shake, setShake] = useState(false);
    const availableTokens = tokens.filter(t => !t.consumed).length;
    const fillPercentage = (availableTokens / config.bucketCapacity) * 100;
    const isAtLimit = availableTokens === 0;

    useEffect(() => {
        const handleRejected = () => {
            setShake(true);
            setTimeout(() => setShake(false), 500);
        };

        window.addEventListener('request-rejected-token-bucket', handleRejected);
        return () => window.removeEventListener('request-rejected-token-bucket', handleRejected);
    }, []);

    return (
        <motion.div
            className="h-full flex flex-col"
            animate={shake ? { x: [-10, 10, -10, 10, 0] } : {}}
            transition={{ duration: 0.4 }}
        >
            <div className="text-center mb-4 pt-2">
                <h3 className="text-lg font-semibold text-foreground">Token Bucket</h3>
                <p className="text-sm text-muted-foreground/70">
                    Tokens refill at {config.refillRate}/s • Capacity {config.bucketCapacity}
                </p>
            </div>

            <Separator className="mb-6 bg-border/50" />

            <div className="flex-1 flex flex-col items-center justify-center">
                <div className="relative">
                    {/* Bucket visualization */}
                    <div className="relative w-48 h-56">
                        {/* Bucket container */}
                        <div
                            className="absolute inset-0 bg-secondary/30 border-2 border-border/40 rounded-b-3xl overflow-hidden"
                            style={{
                                clipPath: 'polygon(10% 0%, 90% 0%, 100% 100%, 0% 100%)',
                            }}
                        >
                            {/* Water/token level */}
                            <motion.div
                                className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-primary/60 to-primary/30"
                                initial={{ height: '100%' }}
                                animate={{ height: `${fillPercentage}%` }}
                                transition={{ type: 'spring', stiffness: 100, damping: 15 }}
                            >
                                {/* Bubble animation */}
                                <div className="absolute inset-0 overflow-hidden">
                                    {[...Array(5)].map((_, i) => (
                                        <motion.div
                                            key={i}
                                            className="absolute w-2 h-2 rounded-full bg-white/10"
                                            initial={{
                                                x: 20 + Math.random() * 100,
                                                y: 200,
                                                scale: 0.5 + Math.random() * 0.5
                                            }}
                                            animate={{
                                                y: -20,
                                                opacity: [0, 1, 0]
                                            }}
                                            transition={{
                                                duration: 2 + Math.random() * 2,
                                                repeat: Infinity,
                                                delay: Math.random() * 2,
                                                ease: 'easeOut'
                                            }}
                                        />
                                    ))}
                                </div>
                            </motion.div>
                        </div>

                        {/* Refill indicator */}
                        <motion.div
                            className="absolute -top-8 left-1/2 -translate-x-1/2"
                            animate={{ y: [0, 5, 0] }}
                            transition={{ duration: 1 / config.refillRate, repeat: Infinity }}
                        >
                            <Droplets className="w-6 h-6 text-primary/60" />
                        </motion.div>

                        {/* Token count inside bucket */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center z-10">
                                <motion.div
                                    className={`text-4xl font-bold font-mono ${isAtLimit ? 'text-destructive/80' : 'text-foreground'}`}
                                    key={availableTokens}
                                    initial={{ scale: 1.5 }}
                                    animate={{ scale: 1 }}
                                >
                                    {availableTokens}
                                </motion.div>
                                <div className="text-xs text-muted-foreground/60">tokens</div>
                            </div>
                        </div>
                    </div>

                    {/* Token grid below */}
                    <div className="mt-4 grid grid-cols-5 gap-2 max-w-[200px]">
                        <AnimatePresence mode="popLayout">
                            {tokens.map((token) => (
                                <motion.div
                                    key={token.id}
                                    layout
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{
                                        scale: 1,
                                        opacity: token.consumed ? 0.2 : 1
                                    }}
                                    exit={{ scale: 0, opacity: 0 }}
                                    transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                                    className={`w-8 h-8 rounded-full flex items-center justify-center ${token.consumed
                                            ? 'bg-muted/30 border border-border/30'
                                            : 'bg-primary/60 glow-primary'
                                        }`}
                                >
                                    <Droplets size={14} className={token.consumed ? 'text-muted-foreground/40' : 'text-primary-foreground/80'} />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>

                <Separator className="my-6 w-64 bg-border/50" />

                {/* Stats */}
                <div className="flex gap-8">
                    <div className="text-center p-3 bg-secondary/20 rounded-lg border border-border/30 min-w-[80px]">
                        <div className={`text-2xl font-bold font-mono ${isAtLimit ? 'text-destructive/80' : 'text-success/80'}`}>
                            {availableTokens}
                        </div>
                        <div className="text-xs text-muted-foreground/60">Available</div>
                    </div>
                    <div className="text-center p-3 bg-secondary/20 rounded-lg border border-border/30 min-w-[80px]">
                        <div className="text-2xl font-bold font-mono text-primary/80">{config.bucketCapacity}</div>
                        <div className="text-xs text-muted-foreground/60">Capacity</div>
                    </div>
                    <div className="text-center p-3 bg-secondary/20 rounded-lg border border-border/30 min-w-[80px]">
                        <div className="text-2xl font-bold font-mono text-foreground/80">{config.refillRate}/s</div>
                        <div className="text-xs text-muted-foreground/60">Refill</div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}