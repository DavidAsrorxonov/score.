import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export interface ScoreCardProps {
  label: string;
  score: number;
  description?: string;
  trend?: string;
  className?: string;
}

function clampScore(score: number) {
  return Math.min(100, Math.max(0, Math.round(score)));
}

export function ScoreCard({
  label,
  score,
  description,
  trend,
  className,
}: ScoreCardProps) {
  const displayScore = clampScore(score);

  return (
    <Card className={cn("min-w-0", className)}>
      <CardHeader className="space-y-1">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
        {description ? (
          <p className="text-xs leading-5 text-muted-foreground">
            {description}
          </p>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <p className="text-3xl font-semibold tabular-nums">
            {displayScore}
          </p>
          {trend ? (
            <p className="pb-1 text-xs text-muted-foreground">{trend}</p>
          ) : null}
        </div>
        <Progress value={displayScore} aria-label={`${label} score`} />
      </CardContent>
    </Card>
  );
}
