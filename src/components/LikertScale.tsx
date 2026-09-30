import { cn } from "@/lib/utils";

interface LikertScaleProps {
  options: { value: string; label: string }[];
  value?: string;
  onChange: (value: string) => void;
  className?: string;
  "aria-label"?: string;
}

/** Five-point agreement scale (prototype `.scale` / `.sc`). */
export function LikertScale({ options, value, onChange, className, ...rest }: LikertScaleProps) {
  return (
    <div role="radiogroup" aria-label={rest["aria-label"]} className={cn("grid grid-cols-3 gap-2 sm:grid-cols-5", className)}>
      {options.map((opt) => {
        const selected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(opt.value)}
            className={cn(
              "rounded-[10px] border-[1.5px] bg-card px-1 py-[11px] text-[0.8rem] font-bold leading-tight transition-colors duration-150",
              selected
                ? "border-accent bg-accent/10 text-card-foreground"
                : "border-border text-muted-foreground hover:border-accent",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/** A question with its scale, separated by a hairline (prototype `.qb`). */
export function QuestionBlock({ title, children }: { title: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="border-b border-border/60 pb-[18px] last:border-b-0 last:pb-0 [&:not(:last-child)]:mb-[18px]">
      <p className="mb-[13px] text-[1.02rem] font-bold leading-relaxed">{title}</p>
      {children}
    </div>
  );
}

export default LikertScale;
