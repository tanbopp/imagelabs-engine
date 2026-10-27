import { jsx as _jsx } from "react/jsx-runtime";
import * as React from 'react';
import * as TogglePrimitive from '@radix-ui/react-toggle';
import { cn } from '@/lib/utils';
export const Toggle = React.forwardRef(({ className, ...props }, ref) => (_jsx(TogglePrimitive.Root, { ref: ref, className: cn('inline-flex items-center justify-center rounded-full text-sm font-medium transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-muted data-[state=on]:text-foreground h-9 px-3 shadow-none', className), ...props })));
Toggle.displayName = TogglePrimitive.Root.displayName;
//# sourceMappingURL=toggle.js.map