import { AlgorithmType } from '@/types/rateLimiter';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Layers, Timer, Droplets, Filter, Info, X } from 'lucide-react';
import { useState } from 'react';

interface AlgorithmSelectorProps {
  selected: AlgorithmType;
  onSelect: (algorithm: AlgorithmType) => void;
}

const algorithms: {
  type: AlgorithmType;
  name: string;
  icon: React.ElementType;
  description: string;
  details: string;
}[] = [
  {
    type: 'fixed-window',
    name: 'Fixed Window',
    icon: Clock,
    description: 'Count requests in fixed time intervals',
    details: 'Divides time into fixed windows (e.g., every minute). Each window has a counter that resets when the window ends. Simple but can allow burst traffic at window boundaries.'
  },
  {
    type: 'sliding-window-log',
    name: 'Sliding Window Log',
    icon: Timer,
    description: 'Track timestamps of each request',
    details: 'Stores the timestamp of each request. When a new request arrives, it counts requests within the last window period. Most accurate but uses more memory.'
  },
  {
    type: 'sliding-window-counter',
    name: 'Sliding Counter',
    icon: Layers,
    description: 'Hybrid approach with weighted counts',
    details: 'Combines fixed window efficiency with sliding window accuracy. Uses weighted average of current and previous window counts based on time position.'
  },
  {
    type: 'token-bucket',
    name: 'Token Bucket',
    icon: Droplets,
    description: 'Tokens refill at steady rate',
    details: 'Bucket holds tokens that refill at a fixed rate. Each request consumes one token. Allows controlled bursts while maintaining average rate limits.'
  },
  {
    type: 'leaky-bucket',
    name: 'Leaky Bucket',
    icon: Filter,
    description: 'Requests leak at constant rate',
    details: 'Requests queue up and are processed at a fixed rate. Smooths out traffic spikes and ensures constant output rate. Excess requests are rejected.'
  },
];

export function AlgorithmSelector({ selected, onSelect }: AlgorithmSelectorProps) {
  const [showInfo, setShowInfo] = useState<AlgorithmType | null>(null);

  return (
    <div className="glass-card p-4">
      <h2 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">Algorithm</h2>
      <div className="grid gap-2">
        {algorithms.map((algo) => {
          const Icon = algo.icon;
          const isSelected = selected === algo.type;

          return (
            <div key={algo.type} className="relative">
              <motion.button
                onClick={() => onSelect(algo.type)}
                className={`relative flex items-center gap-3 p-3 rounded-lg text-left transition-all w-full ${
                  isSelected
                    ? 'bg-primary/5 border border-primary/30'
                    : 'bg-secondary/30 border border-transparent hover:bg-secondary/50 hover:border-border/50'
                }`}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                {isSelected && (
                  <motion.div
                    layoutId="selectedAlgorithm"
                    className="absolute inset-0 rounded-lg border-2 border-primary/50 glow-primary"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
                <div className={`p-2 rounded-md ${isSelected ? 'bg-primary/80 text-primary-foreground' : 'bg-muted/50 text-muted-foreground'}`}>
                  <Icon size={18} />
                </div>
                <div className="relative z-10 flex-1">
                  <div className={`font-medium text-sm ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                    {algo.name}
                  </div>
                  <div className="text-xs text-muted-foreground">{algo.description}</div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowInfo(showInfo === algo.type ? null : algo.type);
                  }}
                  className={`relative z-10 p-1.5 rounded-md transition-colors ${
                    showInfo === algo.type
                      ? 'bg-primary/20 text-primary'
                      : 'hover:bg-secondary text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {showInfo === algo.type ? <X size={14} /> : <Info size={14} />}
                </button>
              </motion.button>

              <AnimatePresence>
                {showInfo === algo.type && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-3 mt-1 rounded-lg bg-secondary/20 border border-border/30 text-xs text-muted-foreground leading-relaxed">
                      {algo.details}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}