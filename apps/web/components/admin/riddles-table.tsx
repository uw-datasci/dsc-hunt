"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import type { AdminRiddle, Event } from "@dsc-hunt/types";
import { Button } from "@dsc-hunt/ui/components/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@dsc-hunt/ui/components/table";
import { QrDownloadButton } from "@/components/admin/qr-download-button";
import { RiddleEditorDialog } from "@/components/admin/riddle-editor-dialog";

interface RiddlesTableProps {
  readonly event: Event;
  readonly riddles: AdminRiddle[];
  /** This site's origin; QR codes encode `${origin}/scan/<qrIdentifier>`. */
  readonly origin: string;
}

export function RiddlesTable({ event, riddles, origin }: RiddlesTableProps) {
  const router = useRouter();
  const [editing, setEditing] = useState<number | null>(null);
  const [refreshing, startRefresh] = useTransition();
  const locked = event.status !== "not_started";
  const editingRiddle = riddles.find((riddle) => riddle.position === editing);

  return (
    <>
      {locked ? (
        <p className="mb-2 text-sm text-muted-foreground">
          Riddles are locked once the hunt starts. QR codes can still be previewed and printed.
        </p>
      ) : null}
      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Riddle</TableHead>
              <TableHead>Location</TableHead>
              <TableHead className="text-right">Answers</TableHead>
              <TableHead>QR code</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {riddles.map((riddle) => {
              const scanUrl = riddle.qrIdentifier
                ? `${origin}/scan/${encodeURIComponent(riddle.qrIdentifier)}`
                : null;
              return (
                <TableRow key={riddle.position}>
                  <TableCell className="tabular-nums">{riddle.position}</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {riddle.text ?? <span className="text-muted-foreground">Not set</span>}
                  </TableCell>
                  <TableCell>
                    {riddle.locationName ?? <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {riddle.answers.length}
                  </TableCell>
                  <TableCell>
                    {scanUrl ? (
                      <a href={scanUrl} target="_blank" rel="noreferrer" title={scanUrl}>
                        <QRCodeSVG value={scanUrl} size={48} marginSize={1} level="M" />
                      </a>
                    ) : (
                      <div className="flex size-12 items-center justify-center rounded border border-dashed text-[10px] text-muted-foreground">
                        None
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    {scanUrl && riddle.locationName ? (
                      <QrDownloadButton
                        url={scanUrl}
                        position={riddle.position}
                        locationName={riddle.locationName}
                      />
                    ) : null}
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={locked || refreshing}
                      onClick={() => setEditing(riddle.position)}
                    >
                      {riddle.text ? "Edit" : "Set up"}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {editingRiddle ? (
        <RiddleEditorDialog
          key={`${editingRiddle.position}-${editingRiddle.qrIdentifier ?? "new"}`}
          eventId={event.id}
          riddle={editingRiddle}
          open
          onOpenChange={(open) => !open && setEditing(null)}
          onSaved={() => startRefresh(() => router.refresh())}
        />
      ) : null}
    </>
  );
}
