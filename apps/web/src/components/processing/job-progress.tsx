import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Job } from '@imagelabs/shared';
import { Loader2, CheckCircle2, AlertCircle, Ban } from 'lucide-react';
import { apiRequest } from '@/lib/api-client';

interface JobProgressProps {
  job: Job | null;
  error?: string | null;
  onCancel?: () => void;
}

export function JobProgress({ job, error, onCancel }: JobProgressProps) {
  if (!job && !error) return null;

  const isFailed = job?.status === 'failed' || !!error;
  const isCompleted = job?.status === 'completed';
  const progressPercent = job?.progress ?? (isCompleted ? 100 : 0);

  const getStatusText = () => {
    if (error) return error;
    if (job?.status === 'queued') return 'In queue... Preparing workers';
    if (job?.status === 'processing') return `Processing images... (${progressPercent}%)`;
    if (job?.status === 'completed') return 'Processing completed!';
    if (job?.status === 'failed') return job.error?.message || 'Processing failed';
    return 'Initializing...';
  };

  const handleCancel = async () => {
    if (job?.id) {
      try {
        await apiRequest(`/jobs/${job.id}`, { method: 'DELETE' });
      } catch {
        // Proceed with UI cancel callback
      }
    }
    if (onCancel) onCancel();
  };

  return (
    <Card className="rounded-2xl border border-border bg-muted/30 shadow-none">
      <CardHeader className="p-6 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {!isCompleted && !isFailed && (
              <Loader2 className="size-5 animate-spin text-foreground" />
            )}
            {isCompleted && <CheckCircle2 className="size-5 text-foreground" />}
            {isFailed && <AlertCircle className="size-5 text-destructive" />}

            <CardTitle className="text-base font-semibold">
              {job ? `Job: ${job.tool.toUpperCase()}` : 'Job Status'}
            </CardTitle>
          </div>

          {!isCompleted && !isFailed && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              className="text-xs text-muted-foreground hover:text-destructive gap-1.5"
            >
              <Ban className="size-3.5" />
              <span>Cancel</span>
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-6 pt-0 space-y-3">
        <Progress value={progressPercent} className="h-2 w-full" />

        <div
          aria-live="polite"
          className="flex items-center justify-between text-xs text-muted-foreground font-medium"
        >
          <span className={isFailed ? 'text-destructive' : ''}>{getStatusText()}</span>
          <span>{progressPercent}%</span>
        </div>
      </CardContent>
    </Card>
  );
}
