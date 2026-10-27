import { jsx as _jsx } from "react/jsx-runtime";
import { cn } from '@/lib/utils';
export function Badge({ className, variant = 'default', ...props }) {
    const variantStyles = {
        default: 'bg-foreground text-background',
        secondary: 'bg-muted text-foreground',
        outline: 'border border-border text-foreground',
        accent: 'bg-foreground text-background font-semibold',
    };
    return (_jsx("div", { className: cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors shadow-none select-none', variantStyles[variant], className), ...props }));
}
//# sourceMappingURL=badge.js.map