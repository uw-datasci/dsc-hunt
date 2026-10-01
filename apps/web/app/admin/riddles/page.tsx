import { Button } from "@dsc-hunt/ui/components/button";
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

// TODO: replace with real data.
const PLACEHOLDER_RIDDLES = [
  {
    id: "1",
    riddle: "I hold a thousand stories but never speak…",
    location: "Location A",
    code: "abc123",
  },
  {
    id: "2",
    riddle: "Where caffeine flows and deadlines grow…",
    location: "Location B",
    code: "def456",
  },
  { id: "3", riddle: "I tick but have no clock…", location: "Location C", code: "ghi789" },
];

export default async function AdminRiddlesPage() {
  return (
    <AdminShell
      title="Riddles"
      actions={
        // TODO: add/edit riddle dialog (riddle text, location name, generated QR code).
        <Button disabled>Add riddle</Button>
      }
    >
      {/* TODO: choose the starting location teams meet at before the hunt begins. */}
      <div className="mb-4 rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
        Starting location: <span className="text-foreground">not set</span>
      </div>

      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Riddle</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>QR code</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {PLACEHOLDER_RIDDLES.map((row, index) => (
              <TableRow key={row.id}>
                <TableCell className="tabular-nums">{index + 1}</TableCell>
                <TableCell className="max-w-xs truncate">{row.riddle}</TableCell>
                <TableCell>{row.location}</TableCell>
                <TableCell>
                  {/* TODO: render a real QR code pointing at /scan/<code>, with print/download. */}
                  <div className="flex size-12 items-center justify-center rounded border border-dashed text-[10px] text-muted-foreground">
                    QR
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  {/* TODO: edit / delete / reorder. */}
                  <Button variant="ghost" size="sm" disabled>
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </AdminShell>
  );
}
