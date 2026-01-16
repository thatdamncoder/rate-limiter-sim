import { motion } from 'framer-motion';
import { AlgorithmType } from '@/types/rateLimiter';
import { BookOpen, CheckCircle2, Clock, Droplets, Coins } from 'lucide-react';

interface AlgorithmExplanationProps {
  algorithm: AlgorithmType;
}

const explanations = {
  'fixed-window': {
    icon: Clock,
    title: 'Fixed Window Counter',
    description: 'Counts requests in fixed time windows. Simple but can allow bursts at window boundaries.',
    howItWorks: [
      'Window starts on first request',
      'Counter increments with each request',
      'Resets when window expires',
      'Can allow 2x limit at boundaries'
    ],
    useCase: 'Best for: Simple rate limiting with predictable windows',
  },
  'sliding-window-log': {
    icon: BookOpen,
    title: 'Sliding Window Log',
    description: 'Maintains a log of request timestamps. Accurate but memory-intensive for high traffic.',
    howItWorks: [
      'Stores timestamp of each request',
      'Continuously slides the window',
      'Removes old timestamps',
      'Perfect accuracy, no boundary issues'
    ],
    useCase: 'Best for: High-precision rate limiting with moderate traffic',
  },
  'sliding-window-counter': {
    icon: CheckCircle2,
    title: 'Sliding Window Counter',
    description: 'Hybrid approach using weighted counts. Balances accuracy and efficiency.',
    howItWorks: [
      'Tracks current and previous windows',
      'Weights counts by time position',
      'Smooths window transitions',
      'Memory efficient with good accuracy'
    ],
    useCase: 'Best for: Production systems needing accuracy and efficiency',
  },
  'token-bucket': {
    icon: Coins,
    title: 'Token Bucket',
    description: 'Tokens refill at a constant rate. Allows controlled bursts while maintaining average rate.',
    howItWorks: [
      'Bucket holds tokens up to capacity',
      'Tokens refill at steady rate',
      'Each request consumes one token',
      'Allows bursts up to bucket size'
    ],
    useCase: 'Best for: APIs allowing controlled burst traffic',
  },
  'leaky-bucket': {
    icon: Droplets,
    title: 'Leaky Bucket',
    description: 'Requests queue and process at fixed rate. Smooths bursty traffic into steady flow.',
    howItWorks: [
      'Requests enter a queue',
      'Queue processes at fixed rate',
      'Excess requests wait or rejected',
      'Enforces strict output rate'
    ],
    useCase: 'Best for: Smoothing traffic to backend services',
  },
};

export function AlgorithmExplanation({ algorithm }: AlgorithmExplanationProps) {
  const explanation = explanations[algorithm];
  const Icon = explanation.icon;

  return (
    <motion.div
      className="glass-card p-5 space-y-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-primary/10 glow-primary">
          <Icon className="w-5 h-5 text-primary/80" />
        </div>
        <div className="flex-1">
          <h3 className="text-base font-semibold text-foreground mb-1">
            {explanation.title}
          </h3>
          <p className="text-sm text-muted-foreground/70">
            {explanation.description}
          </p>
        </div>
      </div>

      {/* How it Works */}
      <div className="space-y-2">
        <h4 className="text-xs font-medium text-muted-foreground/80 uppercase tracking-wide">
          How it Works
        </h4>
        <div className="space-y-1.5">
          {explanation.howItWorks.map((step, index) => (
            <div key={index} className="flex items-start gap-2">
              <div className="w-1 h-1 rounded-full bg-primary/60 mt-2 flex-shrink-0" />
              <p className="text-sm text-muted-foreground/80">{step}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Use Case */}
      <div className="pt-3 border-t border-border/30">
        <p className="text-xs text-muted-foreground/70 italic">
          {explanation.useCase}
        </p>
      </div>
    </motion.div>
  );
}