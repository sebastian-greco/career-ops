import { Card, CardContent } from "@/components/ui/card";

interface MetricChipProps {
  label: string;
  value: string;
  hint?: string;
}

export function MetricChip({ label, value, hint }: MetricChipProps) {
  return (
    <Card className="min-w-0">
      <CardContent className="space-y-1 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
          {label}
        </p>
        <p className="text-2xl font-semibold text-card-foreground">{value}</p>
        {hint ? <p className="text-sm text-muted-foreground">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}
