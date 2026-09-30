import { cn } from "@/lib/utils";

/** The amber "أثر" mark from the prototype (`.mark`). */
export function AtharMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "btn-gradient grid h-8 w-8 flex-none place-items-center rounded-[9px] text-accent-foreground",
        className,
      )}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" fill="none" className="h-[18px] w-[18px]">
        <path d="M3.5 15C6 9 9 9 11 13s4 5 6.5 0" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
        <circle cx="8.6" cy="6.6" r="1.35" fill="currentColor" />
        <circle cx="12.2" cy="6.6" r="1.35" fill="currentColor" />
      </svg>
    </span>
  );
}

/** Mark + "أثر البداية" wordmark (prototype `.wm`). */
export function AtharLogo({ className, label = "أثر البداية" }: { className?: string; label?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5 whitespace-nowrap font-extrabold", className)}>
      <AtharMark />
      {label}
    </span>
  );
}

export default AtharLogo;
