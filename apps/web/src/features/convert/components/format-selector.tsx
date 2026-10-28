interface FormatSelectorProps {
  formats: Array<{ id: string; label: string; desc?: string }>;
  selectedFormat: string;
  onSelect: (format: string) => void;
}

export function FormatSelector({ formats, selectedFormat, onSelect }: FormatSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2 items-center">
      {formats.map((fmt) => {
        const isSelected = selectedFormat === fmt.id;
        return (
          <button
            key={fmt.id}
            type="button"
            onClick={() => onSelect(fmt.id)}
            className={`rounded-full px-5 py-2 text-xs font-semibold tracking-wide transition-colors ${
              isSelected
                ? 'bg-foreground text-background shadow-none'
                : 'bg-muted/50 text-foreground hover:bg-muted border border-border'
            }`}
          >
            {fmt.label}
          </button>
        );
      })}
    </div>
  );
}
