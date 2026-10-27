import { ShieldCheck, Clock, Zap } from 'lucide-react';

export function Footer() {
  return (
    <footer className="w-full border-t border-border bg-background py-10 mt-20">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col items-center md:items-start gap-1">
          <p className="text-sm font-semibold text-foreground">ImageLabs</p>
          <p className="text-xs text-muted-foreground">
            A fast, private, and fully functional image studio. No accounts, no database, no tracking.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Clock className="size-4 text-foreground" />
            <span>Files Auto-Delete in 1h</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="size-4 text-foreground" />
            <span>No Persistent Storage</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Zap className="size-4 text-foreground" />
            <span>High Performance</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
