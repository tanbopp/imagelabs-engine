import { ThemeToggle } from '@/components/common/theme-toggle';
import { QuotaMeter } from '@/components/common/quota-meter';
import { Layers } from 'lucide-react';

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="max-w-[1200px] mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
        <a href="/" className="flex items-center gap-2.5 font-bold text-xl tracking-tight text-foreground">
          <div className="flex size-9 items-center justify-center rounded-xl bg-foreground text-background">
            <Layers className="size-5" />
          </div>
          <span>ImageLabs</span>
        </a>

        <div className="flex items-center gap-3">
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground mr-2">
            <a href="#optimize" className="hover:text-foreground transition-colors">Optimization</a>
            <a href="#convert" className="hover:text-foreground transition-colors">Conversion</a>
            <a href="#edit" className="hover:text-foreground transition-colors">Editing</a>
            <a href="#ai" className="hover:text-foreground transition-colors">Advanced & AI</a>
          </nav>

          <QuotaMeter />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
