import { Card, CardContent, CardHeader, CardTitle } from "@dsc-hunt/ui/components/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@dsc-hunt/ui/components/table";
import { AdminShell } from "@/components/admin/admin-shell";

export const dynamic = "force-dynamic";

// TODO: replace with real data, kept fresh via a realtime subscription to scans.
const PLACEHOLDER_PROGRESS = [
  { team: "The Pumpkin Patch", found: 2, total: 8, lastScan: "Location B · 2 min ago" },
  { team: "Ghouls Gone Wild", found: 1, total: 8, lastScan: "Location A · 9 min ago" },
];

const PLACEHOLDER_SCANS = [
  "The Pumpkin Patch scanned Location B",
  "Ghouls Gone Wild scanned Location A",
  "The Pumpkin Patch scanned Location A",
];

export default async function AdminLivePage() {
  return (
    <AdminShell title="Live">
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Team</TableHead>
                <TableHead className="text-right">Found</TableHead>
                <TableHead>Last scan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {PLACEHOLDER_PROGRESS.map((row) => (
                <TableRow key={row.team}>
                  <TableCell className="font-medium">{row.team}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {row.found} / {row.total}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{row.lastScan}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent scans</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-2 text-sm">
              {PLACEHOLDER_SCANS.map((scan) => (
                <li key={scan} className="text-muted-foreground">
                  🕯️ {scan}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
