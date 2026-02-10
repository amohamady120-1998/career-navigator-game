import { Film } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface CourseVideoProps {
  title: string;
  description: string;
  videoUrl?: string;
  className?: string;
}

export function CourseVideo({ title, description, videoUrl, className }: CourseVideoProps) {
  const hasSource = !!videoUrl;

  return (
    <Card className={cn("overflow-hidden border-primary/20 bg-[hsl(var(--primary))]/[0.03]", className)}>
      <div className="relative w-full bg-muted" style={{ aspectRatio: "16/9" }}>
        {hasSource ? (
          <video
            src={videoUrl}
            controls
            className="w-full h-full object-cover"
            poster=""
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-primary/5 gap-3">
            <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center">
              <Film className="w-8 h-8 text-accent" />
            </div>
            <span className="text-sm text-muted-foreground font-medium">سيتم إضافة الفيديو قريباً</span>
          </div>
        )}
      </div>
      <CardContent className="p-4 text-center space-y-1">
        <h3 className="font-bold text-base text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  );
}
