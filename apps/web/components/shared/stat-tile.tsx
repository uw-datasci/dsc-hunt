import { Card, CardContent } from "@dsc-hunt/ui/components/card";

interface StatTileProps {
  label: string;
  value: React.ReactNode;
}

export function StatTile({ label, value }: Readonly<StatTileProps>) {
  return (
    <Card size="sm">
      <CardContent>
        <p className="text-xs tracking-wide text-muted-foreground uppercase">{label}</p>
        <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}
