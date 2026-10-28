"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { AdminTeam, Event } from "@dsc-hunt/types";
import { Button } from "@dsc-hunt/ui/components/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@dsc-hunt/ui/components/table";
import { TeamManageDialog } from "@/components/admin/team-manage-dialog";

interface TeamsTableProps {
  readonly event: Event;
  readonly teams: AdminTeam[];
  /** Locations per hunt, for the "found" column. */
  readonly totalRiddles: number;
}

export function TeamsTable({ event, teams, totalRiddles }: TeamsTableProps) {
  const router = useRouter();
  const [managing, setManaging] = useState<string | null>(null);
  const [, startRefresh] = useTransition();
  const managedTeam = teams.find((team) => team.id === managing);

  if (teams.length === 0) {
    return (
      <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
        No teams have registered yet.
      </p>
    );
  }

  return (
    <>
      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Team</TableHead>
              <TableHead>Code</TableHead>
              <TableHead className="text-right">Members</TableHead>
              <TableHead className="text-right">Found</TableHead>
              <TableHead className="text-right">Score</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {teams.map((team) => (
              <TableRow key={team.id}>
                <TableCell className="font-medium">{team.name}</TableCell>
                <TableCell className="font-mono tabular-nums">{team.code}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {team.memberCount} / {event.teamSizeCap}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {team.found} / {totalRiddles}
                </TableCell>
                <TableCell className="text-right tabular-nums">{team.totalScore}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => setManaging(team.id)}>
                    Manage
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {managedTeam ? (
        <TeamManageDialog
          key={managedTeam.id}
          event={event}
          team={managedTeam}
          onClose={() => setManaging(null)}
          onChanged={() => startRefresh(() => router.refresh())}
        />
      ) : null}
    </>
  );
}
