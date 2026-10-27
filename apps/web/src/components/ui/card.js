import { jsx as _jsx } from "react/jsx-runtime";
import * as React from 'react';
import { cn } from '@/lib/utils';
export const Card = React.forwardRef(({ className, ...props }, ref) => (_jsx("div", { ref: ref, className: cn('rounded-2xl border border-border bg-muted/30 text-foreground transition-colors shadow-none', className), ...props })));
Card.displayName = 'Card';
export const CardHeader = React.forwardRef(({ className, ...props }, ref) => (_jsx("div", { ref: ref, className: cn('flex flex-col space-y-1.5 p-6', className), ...props })));
CardHeader.displayName = 'CardHeader';
export const CardTitle = React.forwardRef(({ className, ...props }, ref) => (_jsx("h3", { ref: ref, className: cn('font-semibold text-lg leading-snug tracking-tight text-foreground', className), ...props })));
CardTitle.displayName = 'CardTitle';
export const CardDescription = React.forwardRef(({ className, ...props }, ref) => (_jsx("p", { ref: ref, className: cn('text-sm text-muted-foreground leading-relaxed', className), ...props })));
CardDescription.displayName = 'CardDescription';
export const CardContent = React.forwardRef(({ className, ...props }, ref) => (_jsx("div", { ref: ref, className: cn('p-6 pt-0', className), ...props })));
CardContent.displayName = 'CardContent';
//# sourceMappingURL=card.js.map