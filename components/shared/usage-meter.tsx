import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export interface UsageMeterProps {
  used: number;
  limit: number | null;
  label?: string;
  className?: string;
}

export function UsageMeter({
  used,
  limit,
  label = "Scans used today",
  className,
}: UsageMeterProps) {
  const isUnlimited = limit === null;
  const safeLimit = isUnlimited ? 0 : Math.max(0, limit);
  const safeUsed = Math.max(0, used);
  const percent = isUnlimited
    ? 0
    : safeLimit === 0
      ? 100
      : Math.min(100, (safeUsed / safeLimit) * 100);
  const isLimitReached =
    !isUnlimited && safeLimit > 0 && safeUsed >= safeLimit;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <p className="font-medium text-foreground">{label}</p>
        <p className="text-muted-foreground">
          <span className="font-medium text-foreground">{safeUsed}</span>{" "}
          {isUnlimited ? (
            "used"
          ) : (
            <>
              of{" "}
              <span className="font-medium text-foreground">{safeLimit}</span>
            </>
          )}
        </p>
      </div>
      <Progress
        value={percent}
        aria-label={isUnlimited ? `${label}, unlimited` : label}
      />
      {isUnlimited ? (
        <p className="text-xs text-muted-foreground">
          This plan has no daily scan limit.
        </p>
      ) : null}
      {isLimitReached ? (
        <p className="text-xs text-muted-foreground">
          Daily free-tier scan limit reached.
        </p>
      ) : null}
    </div>
  );
}
