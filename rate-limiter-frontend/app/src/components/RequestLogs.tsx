import { motion, AnimatePresence } from 'framer-motion';
import { RequestLog } from '@/types/rateLimiter';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface RequestLogsProps {
  logs: RequestLog[];
}

export function RequestLogs({ logs }: RequestLogsProps) {
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    const ms = date.getMilliseconds().toString().padStart(3, '0');
    return `${hours}:${minutes}:${seconds}.${ms}`;
  };

  return (
    <div className="glass-card p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium text-muted-foreground/70 uppercase tracking-wider">Request Logs</h2>
        <div className="flex items-center gap-1 text-xs text-muted-foreground/50">
          <Clock size={12} />
          <span>{logs.length} entries</span>
        </div>
      </div>

      <Separator className="mb-3 bg-border/30" />

      <ScrollArea className="flex-1">
        <div className="space-y-2 pr-4">
          <AnimatePresence initial={false}>
            {logs.map((log) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -20, height: 0 }}
                animate={{ opacity: 1, x: 0, height: 'auto' }}
                exit={{ opacity: 0, x: 20, height: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className={`p-3 rounded-lg border font-mono text-xs ${
                  log.accepted
                    ? 'bg-success/5 border-success/20 text-success/80'
                    : 'bg-destructive/5 border-destructive/20 text-destructive/80'
                }`}
              >
                <div className="flex items-start gap-2">
                  {log.accepted ? (
                    <CheckCircle2 size={14} className="mt-0.5 flex-shrink-0" />
                  ) : (
                    <XCircle size={14} className="mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-muted-foreground/60">{formatTime(log.timestamp)}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase ${
                        log.accepted ? 'bg-success/10' : 'bg-destructive/10'
                      }`}>
                        {log.accepted ? 'accepted' : 'rejected'}
                      </span>
                    </div>
                    <p className="text-foreground/60 break-words">{log.details}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {logs.length === 0 && (
            <div className="text-center py-8 text-muted-foreground/50 text-sm">
              No requests yet. Click "Send Request" to start.
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}