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
const PLACEHOLDER_TEAMS = [
  { id: "1", name: "The Pumpkin Patch", code: "31031", members: 4, found: 2 },
  { id: "2", name: "Ghouls Gone Wild", code: "66613", members: 3, found: 1 },
  { id: "3", name: "Team name", code: "00000", members: 0, found: 0 },
];

export default async function AdminTeamsPage() {
  return (
    <AdminShell title="Teams">
      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Team</TableHead>
              <TableHead>Code</TableHead>
              <TableHead className="text-right">Members</TableHead>
              <TableHead className="text-right">Found</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {PLACEHOLDER_TEAMS.map((team) => (
              <TableRow key={team.id}>
                <TableCell className="font-medium">{team.name}</TableCell>
                <TableCell className="font-mono tabular-nums">{team.code}</TableCell>
                <TableCell className="text-right tabular-nums">{team.members}</TableCell>
                <TableCell className="text-right tabular-nums">{team.found}</TableCell>
                <TableCell className="text-right">
                  {/* TODO: team detail view (members list, remove member, delete team). */}
                  <Button variant="ghost" size="sm" disabled>
                    Manage
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
