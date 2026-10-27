import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as Icons from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
export function ToolCard({ tool }) {
    // Dynamically resolve icon from lucide-react with fallback to FileImage
    const IconComponent = Icons[tool.icon] || Icons.FileImage;
    return (_jsx("a", { href: `#tool-${tool.id}`, className: "group block outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 rounded-2xl", children: _jsx(Card, { className: "h-full border border-border bg-muted/20 hover:border-foreground hover:bg-muted/40 transition-all duration-150", children: _jsxs(CardHeader, { className: "p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("div", { className: "flex size-12 items-center justify-center rounded-xl bg-foreground text-background transition-transform duration-150", children: _jsx(IconComponent, { className: "size-6" }) }), tool.requiresAI && (_jsx(Badge, { variant: "accent", children: "AI Powered" }))] }), _jsx(CardTitle, { className: "text-lg group-hover:text-foreground", children: tool.label }), _jsx(CardDescription, { className: "mt-2 text-sm line-clamp-2", children: tool.description })] }) }) }));
}
//# sourceMappingURL=tool-card.js.map