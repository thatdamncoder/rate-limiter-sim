import { AlgorithmType, AlgorithmConfig } from '@/types/rateLimiter';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';

interface ConfigPanelProps {
  algorithm: AlgorithmType;
  config: AlgorithmConfig;
  onChange: (config: AlgorithmConfig) => void;
}

export function ConfigPanel({ algorithm, config, onChange }: ConfigPanelProps) {
  const isWindowBased = ['fixed-window', 'sliding-window-log', 'sliding-window-counter'].includes(algorithm);
  const isTokenBucket = algorithm === 'token-bucket';
  const isLeakyBucket = algorithm === 'leaky-bucket';

  return (
    <div className="glass-card p-4 space-y-5">
      <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Configuration</h2>
      
      {isWindowBased && (
        <>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-sm text-foreground">Max Requests</Label>
              <span className="text-sm font-mono text-primary">{config.maxRequests}</span>
            </div>
            <Slider
              value={[config.maxRequests]}
              onValueChange={([value]) => onChange({ ...config, maxRequests: value })}
              min={1}
              max={20}
              step={1}
              className="py-2"
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-sm text-foreground">Window Size</Label>
              <span className="text-sm font-mono text-primary">{config.windowSize}s</span>
            </div>
            <Slider
              value={[config.windowSize]}
              onValueChange={([value]) => onChange({ ...config, windowSize: value })}
              min={1}
              max={30}
              step={1}
              className="py-2"
            />
          </div>
        </>
      )}
      
      {isTokenBucket && (
        <>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-sm text-foreground">Bucket Capacity</Label>
              <span className="text-sm font-mono text-primary">{config.bucketCapacity}</span>
            </div>
            <Slider
              value={[config.bucketCapacity]}
              onValueChange={([value]) => onChange({ ...config, bucketCapacity: value })}
              min={1}
              max={20}
              step={1}
              className="py-2"
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-sm text-foreground">Refill Rate</Label>
              <span className="text-sm font-mono text-primary">{config.refillRate}/s</span>
            </div>
            <Slider
              value={[config.refillRate]}
              onValueChange={([value]) => onChange({ ...config, refillRate: value })}
              min={0.5}
              max={5}
              step={0.5}
              className="py-2"
            />
          </div>
        </>
      )}
      
      {isLeakyBucket && (
        <>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-sm text-foreground">Queue Capacity</Label>
              <span className="text-sm font-mono text-primary">{config.bucketCapacity}</span>
            </div>
            <Slider
              value={[config.bucketCapacity]}
              onValueChange={([value]) => onChange({ ...config, bucketCapacity: value })}
              min={1}
              max={20}
              step={1}
              className="py-2"
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-sm text-foreground">Leak Rate</Label>
              <span className="text-sm font-mono text-primary">{config.leakRate}/s</span>
            </div>
            <Slider
              value={[config.leakRate]}
              onValueChange={([value]) => onChange({ ...config, leakRate: value })}
              min={0.5}
              max={5}
              step={0.5}
              className="py-2"
            />
          </div>
        </>
      )}
    </div>
  );
}