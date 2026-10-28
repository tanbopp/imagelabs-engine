import { PrivacyBadge } from '@/features/common/components/privacy-badge';

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

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <PrivacyBadge />
        </div>
      </div>
    </footer>
  );
}
