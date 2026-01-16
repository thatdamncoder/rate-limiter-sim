import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Send, RotateCcw, Zap, Pause, Play, Loader2 } from 'lucide-react';

interface ControlPanelProps {
  onSendRequest: () => Promise<boolean>;
  onReset: () => void;
  isLoading?: boolean;
  isDisabled?: boolean;
}

export function ControlPanel({ onSendRequest, onReset, isLoading = false, isDisabled = false }: ControlPanelProps) {
  const [autoMode, setAutoMode] = useState(false);
  const [requestRate, setRequestRate] = useState(2);
  const [burstMode, setBurstMode] = useState(false);
  const [burstCount, setBurstCount] = useState(5);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (autoMode && !isDisabled) {
      intervalRef.current = setInterval(() => {
        onSendRequest();
      }, 1000 / requestRate);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoMode, requestRate, onSendRequest, isDisabled]);

  // Stop auto mode if disabled
  useEffect(() => {
    if (isDisabled && autoMode) {
      setAutoMode(false);
    }
  }, [isDisabled, autoMode]);

  const handleBurst = async () => {
    for (let i = 0; i < burstCount; i++) {
      setTimeout(() => onSendRequest(), i * 50);
    }
  };

  return (
    <div className="glass-card p-4 space-y-4">
      <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Controls</h2>

      {/* Manual controls */}
      <div className="flex gap-2">
        <Button
          onClick={onSendRequest}
          className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
          disabled={autoMode || isLoading || isDisabled}
        >
          {isLoading ? (
            <Loader2 size={16} className="mr-2 animate-spin" />
          ) : (
            <Send size={16} className="mr-2" />
          )}
          Send Request
        </Button>
        <Button
          onClick={onReset}
          variant="outline"
          className="border-border hover:bg-secondary"
          disabled={isLoading}
        >
          <RotateCcw size={16} />
        </Button>
      </div>

      {/* Auto mode */}
      <div className="space-y-3 pt-2 border-t border-border">
        <div className="flex items-center justify-between">
          <Label className="text-sm text-foreground flex items-center gap-2">
            {autoMode ? <Pause size={14} /> : <Play size={14} />}
            Auto Mode
          </Label>
          <Switch
            checked={autoMode}
            onCheckedChange={setAutoMode}
            disabled={isDisabled}
          />
        </div>

        {autoMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-2"
          >
            <div className="flex justify-between items-center">
              <Label className="text-xs text-muted-foreground">Request Rate</Label>
              <span className="text-xs font-mono text-primary">{requestRate}/s</span>
            </div>
            <Slider
              value={[requestRate]}
              onValueChange={([value]) => setRequestRate(value)}
              min={0.5}
              max={10}
              step={0.5}
            />
          </motion.div>
        )}
      </div>

      {/* Burst mode */}
      <div className="space-y-3 pt-2 border-t border-border">
        <div className="flex items-center justify-between">
          <Label className="text-sm text-foreground flex items-center gap-2">
            <Zap size={14} />
            Burst Mode
          </Label>
          <Switch
            checked={burstMode}
            onCheckedChange={setBurstMode}
            disabled={isDisabled}
          />
        </div>

        {burstMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-3"
          >
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-xs text-muted-foreground">Burst Count</Label>
                <span className="text-xs font-mono text-primary">{burstCount}</span>
              </div>
              <Slider
                value={[burstCount]}
                onValueChange={([value]) => setBurstCount(value)}
                min={2}
                max={20}
                step={1}
              />
            </div>
            <Button
              onClick={handleBurst}
              variant="outline"
              className="w-full border-warning text-warning hover:bg-warning/10"
              disabled={isLoading || isDisabled}
            >
              <Zap size={16} className="mr-2" />
              Send {burstCount} Requests
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}