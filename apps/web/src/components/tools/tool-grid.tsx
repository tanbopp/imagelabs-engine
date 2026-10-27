import { TOOLS, TOOL_CATEGORIES, ToolCategory } from '@imagelabs/shared';
import { ToolCard } from './tool-card';

interface ToolGridProps {
  onSelectTool?: (toolId: string) => void;
}

export function ToolGrid({ onSelectTool }: ToolGridProps) {
  const categories = (Object.keys(TOOL_CATEGORIES) as ToolCategory[]).sort(
    (a, b) => TOOL_CATEGORIES[a].order - TOOL_CATEGORIES[b].order,
  );

  return (
    <div className="space-y-14">
      {categories.map((category) => {
        const categoryMeta = TOOL_CATEGORIES[category];
        const categoryTools = TOOLS.filter((tool) => tool.category === category);

        if (categoryTools.length === 0) return null;

        return (
          <section key={category} id={category} className="space-y-6 scroll-mt-24">
            <div className="border-b border-border pb-3">
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                {categoryMeta.label}
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {categoryTools.map((tool) => (
                <ToolCard key={tool.id} tool={tool} onSelect={onSelectTool} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
