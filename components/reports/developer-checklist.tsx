import { CheckCircle2, Circle } from "lucide-react";

import { cn } from "@/lib/utils";

export interface ChecklistItem {
  label: string;
  description?: string;
  checked?: boolean;
}

export interface DeveloperChecklistProps {
  items: ChecklistItem[];
  className?: string;
}

export function DeveloperChecklist({
  items,
  className,
}: DeveloperChecklistProps) {
  return (
    <ul className={cn("space-y-3", className)}>
      {items.map((item, index) => {
        const Icon = item.checked ? CheckCircle2 : Circle;

        return (
          <li
            key={`${item.label}-${index}`}
            className="flex gap-3 rounded-lg border border-border bg-card p-4"
          >
            <Icon
              className="mt-0.5 size-4 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-medium text-card-foreground">
                {item.label}
              </p>
              {item.description ? (
                <p className="text-sm leading-6 text-muted-foreground">
                  {item.description}
                </p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
