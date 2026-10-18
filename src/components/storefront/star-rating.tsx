import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function StarRating({
  rating,
  count,
  className,
  size = "sm",
}: {
  rating: number;
  count?: number;
  className?: string;
  size?: "sm" | "md";
}) {
  const icon = size === "sm" ? "size-3" : "size-4";
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <div className="flex items-center gap-0.5" role="img" aria-label={`Rated ${rating} out of 5`}>
        {[0, 1, 2, 3, 4].map((i) => {
          const fill = Math.max(0, Math.min(1, rating - i));
          return (
            <span key={i} className={cn("relative inline-block", icon)}>
              <Star className={cn("absolute inset-0 text-gold/30", icon)} fill="currentColor" strokeWidth={0} />
              <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                <Star className={cn("text-gold", icon)} fill="currentColor" strokeWidth={0} />
              </span>
            </span>
          );
        })}
      </div>
      {count !== undefined && (
        <span className="text-xs text-muted-foreground">
          {rating.toFixed(1)} ({count})
        </span>
      )}
    </div>
  );
}
