import * as React from 'react';
import { Header } from './header';
import { Footer } from './footer';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />
      <main className="flex-1 w-full max-w-[1200px] mx-auto px-4 sm:px-6 py-10">
        {children}
      </main>
      <Footer />
    </div>
  );
}
