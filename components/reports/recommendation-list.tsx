import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface RecommendationItem {
  title: string;
  description?: string;
  priority?: string;
}

export interface RecommendationListProps {
  items: RecommendationItem[];
  className?: string;
}

export function RecommendationList({
  items,
  className,
}: RecommendationListProps) {
  return (
    <ol className={cn("space-y-3", className)}>
      {items.map((item, index) => (
        <li
          key={`${item.title}-${index}`}
          className="rounded-lg border border-border bg-card p-4"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 space-y-1">
              <h3 className="text-sm font-medium text-card-foreground">
                {item.title}
              </h3>
              {item.description ? (
                <p className="text-sm leading-6 text-muted-foreground">
                  {item.description}
                </p>
              ) : null}
            </div>
            {item.priority ? (
              <Badge variant="secondary" className="shrink-0">
                {item.priority}
              </Badge>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
