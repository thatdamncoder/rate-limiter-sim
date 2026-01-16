import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Activity } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface StatsPanelProps {
  accepted: number;
  rejected: number;
}

export function StatsPanel({ accepted, rejected }: StatsPanelProps) {
  const total = accepted + rejected;
  const successRate = total > 0 ? ((accepted / total) * 100).toFixed(1) : '0.0';

  return (
    <div className="glass-card p-4">
      <h2 className="text-sm font-medium text-muted-foreground/70 mb-3 uppercase tracking-wider">Statistics</h2>

      <Separator className="mb-4 bg-border/30" />

      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-success/10 mb-2">
            <CheckCircle2 className="w-5 h-5 text-success/70" />
          </div>
          <motion.div
            className="text-2xl font-bold font-mono text-success/80"
            key={accepted}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
          >
            {accepted}
          </motion.div>
          <div className="text-xs text-muted-foreground/60">Accepted</div>
        </div>

        <div className="text-center">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-destructive/10 mb-2">
            <XCircle className="w-5 h-5 text-destructive/70" />
          </div>
          <motion.div
            className="text-2xl font-bold font-mono text-destructive/80"
            key={rejected}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
          >
            {rejected}
          </motion.div>
          <div className="text-xs text-muted-foreground/60">Rejected</div>
        </div>

        <div className="text-center">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 mb-2">
            <Activity className="w-5 h-5 text-primary/70" />
          </div>
          <div className="text-2xl font-bold font-mono text-primary/80">{successRate}%</div>
          <div className="text-xs text-muted-foreground/60">Success Rate</div>
        </div>
      </div>
    </div>
  );
}