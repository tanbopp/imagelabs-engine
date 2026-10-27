import * as Icons from 'lucide-react';
import { ToolMeta } from '@imagelabs/shared';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ToolCardProps {
  tool: ToolMeta;
  onSelect?: (toolId: string) => void;
}

export function ToolCard({ tool, onSelect }: ToolCardProps) {
  const IconComponent = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[tool.icon] || Icons.FileImage;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect && onSelect(tool.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (onSelect) onSelect(tool.id);
        }
      }}
      className="group block outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 rounded-2xl cursor-pointer"
    >
      <Card className="h-full border border-border bg-muted/20 hover:border-foreground hover:bg-muted/40 transition-all duration-150">
        <CardHeader className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex size-12 items-center justify-center rounded-xl bg-foreground text-background transition-transform duration-150">
              <IconComponent className="size-6" />
            </div>
            {tool.requiresAI && (
              <Badge variant="accent">
                AI Powered
              </Badge>
            )}
          </div>
          <CardTitle className="text-lg group-hover:text-foreground">
            {tool.label}
          </CardTitle>
          <CardDescription className="mt-2 text-sm line-clamp-2">
            {tool.description}
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
