import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlgorithmType, AlgorithmConfig } from '@/types/rateLimiter';
import { useRateLimiter } from '@/hooks/useRateLimiter';
import { initRateLimiter, resetRateLimiter } from '@/services/rateLimiterApi';
import { AlgorithmSelector } from '@/components/AlgorithmSelector';
import { ConfigPanel } from '@/components/ConfigPanel';
import { ControlPanel } from '@/components/ControlPanel';
import { RequestLogs } from '@/components/RequestLogs';
import { StatsPanel } from '@/components/StatsPanel';
import { AlgorithmExplanation } from '@/components/AlgorithmExplanation';
import { FixedWindowViz } from '@/components/visualizations/FixedWindowViz';
import { SlidingWindowViz } from '@/components/visualizations/SlidingWindowViz';
import { SlidingCounterViz } from '@/components/visualizations/SlidingCounterViz';
import { TokenBucketViz } from '@/components/visualizations/TokenBucketViz';
import { LeakyBucketViz } from '@/components/visualizations/LeakyBucketViz';
import { Activity, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

const defaultConfig: AlgorithmConfig = {
  maxRequests: 5,
  windowSize: 10,
  refillRate: 1,
  bucketCapacity: 10,
  leakRate: 1,
};

const Index = () => {
  const [algorithm, setAlgorithm] = useState<AlgorithmType>('token-bucket');
  const [config, setConfig] = useState<AlgorithmConfig>(defaultConfig);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const { toast } = useToast();

  const {
    makeRequest,
    reset,
    logs,
    stats,
    isLoading,
    fixedWindowCount,
    currentWindowStart,
    requestTimestamps,
    windowSlots,
    tokens,
    queue,
    slidingWindowCounterMetadata
  } = useRateLimiter(algorithm, config);

  // Initialize backend when algorithm or config changes
  const initializeBackend = useCallback(async () => {
    setIsInitializing(true);
    try {
      await initRateLimiter(algorithm, config);
      setIsInitialized(true);
      toast({
        title: 'Rate Limiter Initialized',
        description: `${algorithm.replace(/-/g, ' ')} configured successfully`,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast({
        title: 'Initialization Failed',
        description: errorMessage,
        variant: 'destructive',
      });
      setIsInitialized(false);
    } finally {
      setIsInitializing(false);
    }
  }, [algorithm, config, toast]);

  // Auto-initialize on mount and when algorithm/config changes
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      initializeBackend();
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [algorithm, config, initializeBackend]);

  const handleAlgorithmChange = useCallback((newAlgorithm: AlgorithmType) => {
    setAlgorithm(newAlgorithm);
    reset();
  }, [reset]);

  const handleConfigChange = useCallback((newConfig: AlgorithmConfig) => {
    setConfig(newConfig);
  }, []);

  const handleReset = useCallback(async () => {
    try {
      await resetRateLimiter();
      reset();
      await initializeBackend();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast({
        title: 'Reset Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  }, [reset, initializeBackend, toast]);

  const renderVisualization = () => {
    switch (algorithm) {
      case 'fixed-window':
        return (
          <FixedWindowViz
            count={fixedWindowCount}
            windowStart={currentWindowStart}
            config={config}
          />
        );
      case 'sliding-window-log':
        return (
          <SlidingWindowViz
            timestamps={requestTimestamps}
            config={config}
          />
        );
      case 'sliding-window-counter':
        return (
          <SlidingCounterViz
            slots={windowSlots}
            config={config}
            backendState={slidingWindowCounterMetadata}
          />
        );
      case 'token-bucket':
        return (
          <TokenBucketViz
            tokens={tokens}
            config={config}
          />
        );
      case 'leaky-bucket':
        return (
          <LeakyBucketViz
            queue={queue}
            config={config}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      {/* Header */}
      <motion.header
        className="mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-primary/10 glow-primary">
            <Activity className="w-6 h-6 text-primary/80" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Rate Limiter <span className="text-primary/80">Visualizer</span>
          </h1>
          {isInitializing && (
            <Loader2 className="w-5 h-5 text-primary/60 animate-spin" />
          )}
          {isInitialized && !isInitializing && (
            <span className="text-xs text-success/80 bg-success/10 px-2 py-1 rounded-full border border-success/20">
              Connected
            </span>
          )}
        </div>
        <p className="text-muted-foreground/70 text-sm md:text-base">
          Interactive visualization of rate limiting algorithms
        </p>
      </motion.header>

      <Separator className="mb-6 bg-border/30" />

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        {/* Left Sidebar - Algorithm & Config */}
        <motion.div
          className="lg:col-span-3 space-y-4"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <AlgorithmSelector
            selected={algorithm}
            onSelect={handleAlgorithmChange}
          />
          <Separator className="bg-border/30" />
          <ConfigPanel
            algorithm={algorithm}
            config={config}
            onChange={handleConfigChange}
          />
        </motion.div>

        {/* Center - Visualization */}
        <motion.div
          className="lg:col-span-6 space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {/* Visualization */}
          <div className="glass-card p-6 min-h-[520px] relative">
            {isInitializing && (
              <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10 rounded-lg">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-8 h-8 text-primary/60 animate-spin" />
                  <span className="text-sm text-muted-foreground/60">Initializing...</span>
                </div>
              </div>
            )}
            {renderVisualization()}
          </div>

          {/* Explanation Panel */}
          <AlgorithmExplanation algorithm={algorithm} />
        </motion.div>

        {/* Right Sidebar - Controls & Logs */}
        <motion.div
          className="lg:col-span-3 space-y-4"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <ControlPanel
            onSendRequest={makeRequest}
            onReset={handleReset}
            isLoading={isLoading}
            isDisabled={!isInitialized || isInitializing}
          />
          <Separator className="bg-border/30" />
          <div className="h-[340px]">
            <RequestLogs logs={logs} />
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <Separator className="mt-8 mb-4 bg-border/30" />
      <motion.footer
        className="text-center text-xs text-muted-foreground/50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <p>Rate Limiting Algorithms Visualizer • Token Bucket • Leaky Bucket • Fixed Window • Sliding Window</p>
      </motion.footer>
    </div>
  );
};

export default Index;