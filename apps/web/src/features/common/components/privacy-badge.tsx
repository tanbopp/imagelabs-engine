import { ShieldCheck, Clock, EyeOff } from 'lucide-react';

export function PrivacyBadge() {
  return (
    <div className="inline-flex items-center gap-4 text-xs text-muted-foreground bg-muted/30 border border-border/60 px-4 py-2 rounded-full backdrop-blur-sm select-none">
      <div className="flex items-center gap-1.5 font-medium text-foreground">
        <ShieldCheck className="size-3.5 text-primary" />
        <span>Zero Data Retention</span>
      </div>

      <span className="h-3 w-px bg-border hidden sm:block" />

      <div className="flex items-center gap-1.5 hidden sm:flex">
        <Clock className="size-3.5 text-muted-foreground" />
        <span>1h Ephemeral Auto-Delete</span>
      </div>

      <span className="h-3 w-px bg-border hidden sm:block" />

      <div className="flex items-center gap-1.5 hidden sm:flex">
        <EyeOff className="size-3.5 text-muted-foreground" />
        <span>No Database & No Accounts</span>
      </div>
    </div>
  );
}
