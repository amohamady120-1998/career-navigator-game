import { Loader2 } from "lucide-react";

export function LoadingSpinner({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center py-20 ${className}`}>
      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
    </div>
  );
}
