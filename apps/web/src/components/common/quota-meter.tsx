import { useQuota } from '@/hooks/use-quota';
import { Gauge } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

export function QuotaMeter() {
  const { quota, resetsAt } = useQuota();

  if (!quota) return null;

  const jobsUsed = quota.jobsUsedToday;
  const jobsLimit = quota.jobsLimitToday;
  const percentUsed = Math.min(100, Math.round((jobsUsed / jobsLimit) * 100));

  // Visual state styling: normal, warning (80%), or limit reached (100%)
  let badgeColor = 'bg-muted/70 text-muted-foreground border-border';
  if (percentUsed >= 100) {
    badgeColor = 'bg-destructive/15 text-destructive border-destructive/30 font-bold';
  } else if (percentUsed >= 80) {
    badgeColor = 'bg-amber-500/15 text-amber-500 border-amber-500/30 font-semibold';
  }

  const formatBytes = (bytes: number) => {
    return `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
  };

  const getTimeUntilReset = () => {
    if (!resetsAt) return 'Midnight UTC';
    const diffHours = Math.max(
      0,
      Math.ceil((new Date(resetsAt).getTime() - Date.now()) / (1000 * 60 * 60)),
    );
    return `${diffHours} hour${diffHours === 1 ? '' : 's'}`;
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs border cursor-pointer select-none transition-colors ${badgeColor}`}
        >
          <Gauge className="size-3.5" />
          <span>
            {jobsUsed} / {jobsLimit} Free Jobs
          </span>
        </div>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs space-y-2 p-3 text-xs bg-popover text-popover-foreground border-border shadow-none rounded-xl">
        <div className="font-semibold text-foreground">Daily Free Allowance</div>
        <div className="space-y-1 text-muted-foreground">
          <div className="flex justify-between">
            <span>Jobs Processed:</span>
            <span className="font-mono text-foreground">
              {jobsUsed} / {jobsLimit}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Bandwidth Used:</span>
            <span className="font-mono text-foreground">
              {formatBytes(quota.bytesUsedToday)} / {formatBytes(quota.bytesLimitToday)}
            </span>
          </div>
        </div>
        <div className="pt-1.5 border-t border-border/50 text-[11px] text-muted-foreground">
          Resets in {getTimeUntilReset()} (Midnight UTC). No sign-up required.
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
