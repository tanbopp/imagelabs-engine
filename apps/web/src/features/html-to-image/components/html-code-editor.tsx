import { Card } from '@/components/ui/card';
import { Code2 } from 'lucide-react';

interface HtmlCodeEditorProps {
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
}

export function HtmlCodeEditor({ value, onChange, disabled }: HtmlCodeEditorProps) {
  return (
    <Card className="p-4 bg-neutral-950 border-border space-y-3 font-mono">
      <div className="flex items-center justify-between text-xs text-muted-foreground border-b border-border/50 pb-2">
        <span className="flex items-center gap-1.5 font-semibold text-foreground">
          <Code2 className="size-3.5 text-primary" /> HTML / CSS Editor
        </span>
        <span>UTF-8 • Standard CSS3 Supported</span>
      </div>

      <textarea
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        rows={12}
        placeholder="<!DOCTYPE html>..."
        className="w-full bg-transparent text-sm text-foreground/90 font-mono outline-none resize-y leading-relaxed focus:ring-0 border-0"
        spellCheck={false}
      />
    </Card>
  );
}
