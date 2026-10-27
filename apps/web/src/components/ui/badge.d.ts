import * as React from 'react';
export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'secondary' | 'outline' | 'accent';
}
export declare function Badge({ className, variant, ...props }: BadgeProps): React.JSX.Element;
//# sourceMappingURL=badge.d.ts.map