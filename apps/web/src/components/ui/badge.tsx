import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'accent';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variantStyles = {
    default: 'bg-foreground text-background',
    secondary: 'bg-muted text-foreground',
    outline: 'border border-border text-foreground',
    accent: 'bg-foreground text-background font-semibold',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors shadow-none select-none',
        variantStyles[variant],
        className,
      )}
      {...props}
    />
  );
}
