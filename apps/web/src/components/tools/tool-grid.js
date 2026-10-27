import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { TOOLS, TOOL_CATEGORIES } from '@imagelabs/shared';
import { ToolCard } from './tool-card';
export function ToolGrid() {
    const categories = Object.keys(TOOL_CATEGORIES).sort((a, b) => TOOL_CATEGORIES[a].order - TOOL_CATEGORIES[b].order);
    return (_jsx("div", { className: "space-y-14", children: categories.map((category) => {
            const categoryMeta = TOOL_CATEGORIES[category];
            const categoryTools = TOOLS.filter((tool) => tool.category === category);
            if (categoryTools.length === 0)
                return null;
            return (_jsxs("section", { id: category, className: "space-y-6 scroll-mt-24", children: [_jsx("div", { className: "border-b border-border pb-3", children: _jsx("h2", { className: "text-xl font-bold tracking-tight text-foreground", children: categoryMeta.label }) }), _jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6", children: categoryTools.map((tool) => (_jsx(ToolCard, { tool: tool }, tool.id))) })] }, category));
        }) }));
}
//# sourceMappingURL=tool-grid.js.map