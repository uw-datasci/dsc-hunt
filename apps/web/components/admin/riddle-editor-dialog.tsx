"use client";

import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { toast } from "sonner";
import type { AdminRiddle } from "@dsc-hunt/types";
import { Button } from "@dsc-hunt/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@dsc-hunt/ui/components/dialog";
import { Input } from "@dsc-hunt/ui/components/input";
import { Label } from "@dsc-hunt/ui/components/label";
import { Textarea } from "@dsc-hunt/ui/components/textarea";
import { apiErrorMessage } from "@/lib/api/error-message";

/** Mirrors the API's limits; the API re-checks (by file bytes, not name). */
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

interface RiddleEditorDialogProps {
  readonly eventId: string;
  readonly riddle: AdminRiddle;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  /** Called after a successful save or QR regeneration, to reload the page data. */
  readonly onSaved: () => void;
}

/** Edits one of the 6 riddle positions: text, location, accepted answers, QR code. */
export function RiddleEditorDialog({
  eventId,
  riddle,
  open,
  onOpenChange,
  onSaved,
}: RiddleEditorDialogProps) {
  const [text, setText] = useState(riddle.text ?? "");
  const [locationName, setLocationName] = useState(riddle.locationName ?? "");
  const [answers, setAnswers] = useState(riddle.answers.join("\n"));
  const [busy, setBusy] = useState<"save" | "regenerate" | "image" | null>(null);
  const [hasImage, setHasImage] = useState(riddle.hasImage);
  // Bumped after each upload so the preview doesn't show a cached old image.
  const [imageVersion, setImageVersion] = useState(0);
  const fileInput = useRef<HTMLInputElement>(null);
  // The riddle row exists once it's been saved; images attach to it.
  const isSaved = riddle.text !== null;
  const [confirmRegenerate, setConfirmRegenerate] = useState(false);
  const base = `/api/admin/events/${encodeURIComponent(eventId)}/riddles/${riddle.position}`;

  const answerList = answers
    .split("\n")
    .map((answer) => answer.trim())
    .filter(Boolean);

  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy("save");
    try {
      const response = await fetch(base, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, locationName, answers: answerList }),
      });
      if (!response.ok) {
        toast.error(await apiErrorMessage(response, "Couldn't save the riddle"));
        return;
      }
      toast.success(`Riddle ${riddle.position} saved`);
      onOpenChange(false);
      onSaved();
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  async function regenerate() {
    setBusy("regenerate");
    try {
      const response = await fetch(`${base}/regenerate-qr`, { method: "POST" });
      if (!response.ok) {
        toast.error(await apiErrorMessage(response, "Couldn't regenerate the QR code"));
        return;
      }
      toast.success(`New QR code for riddle ${riddle.position}. Reprint it.`);
      setConfirmRegenerate(false);
      onSaved();
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  async function uploadImage(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow picking the same file again
    if (!file) return;
    if (!IMAGE_TYPES.includes(file.type)) {
      toast.error("Only JPEG, PNG, WebP or GIF images are allowed");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error("Images can be at most 5 MB");
      return;
    }
    setBusy("image");
    try {
      const form = new FormData();
      form.append("file", file);
      const response = await fetch(`${base}/image`, { method: "POST", body: form });
      if (!response.ok) {
        toast.error(await apiErrorMessage(response, "Couldn't upload the image"));
        return;
      }
      setHasImage(true);
      setImageVersion((version) => version + 1);
      toast.success(`Image added to riddle ${riddle.position}`);
      onSaved();
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  async function removeImage() {
    setBusy("image");
    try {
      const response = await fetch(`${base}/image`, { method: "DELETE" });
      if (!response.ok) {
        toast.error(await apiErrorMessage(response, "Couldn't remove the image"));
        return;
      }
      setHasImage(false);
      toast.success(`Image removed from riddle ${riddle.position}`);
      onSaved();
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  const canSave = text.trim() && locationName.trim() && answerList.length > 0 && !busy;

  return (
    <Dialog open={open} onOpenChange={(next) => !busy && onOpenChange(next)}>
      <DialogContent className="sm:max-w-lg">
        <form className="grid gap-4" onSubmit={save}>
          <DialogHeader>
            <DialogTitle>Riddle {riddle.position}</DialogTitle>
            <DialogDescription>
              Players see the riddle text. Solving it reveals the location to go scan.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-2">
            <Label htmlFor={`riddle-text-${riddle.position}`}>Riddle</Label>
            <Textarea
              id={`riddle-text-${riddle.position}`}
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={2000}
              rows={4}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor={`riddle-location-${riddle.position}`}>Location</Label>
            <Input
              id={`riddle-location-${riddle.position}`}
              placeholder="DC Library entrance"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              maxLength={200}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor={`riddle-answers-${riddle.position}`}>Accepted answers</Label>
            <Textarea
              id={`riddle-answers-${riddle.position}`}
              placeholder={"library\nDC library"}
              value={answers}
              onChange={(e) => setAnswers(e.target.value)}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              One per line, up to 10. Matching ignores case, spaces, punctuation, accents and a
              leading &quot;the&quot;/&quot;a&quot;/&quot;an&quot;.
            </p>
          </div>

          <div className="grid gap-2">
            <Label>
              Image <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            {isSaved ? (
              <div className="flex flex-wrap items-center gap-3">
                {hasImage ? (
                  // eslint-disable-next-line @next/next/no-img-element -- signed URL via redirect
                  <img
                    src={`${base}/image?v=${imageVersion}`}
                    alt={`Image for riddle ${riddle.position}`}
                    className="h-20 w-28 rounded border object-contain"
                  />
                ) : null}
                <input
                  ref={fileInput}
                  type="file"
                  accept={IMAGE_TYPES.join(",")}
                  className="hidden"
                  onChange={(e) => void uploadImage(e)}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={busy !== null}
                  onClick={() => fileInput.current?.click()}
                >
                  {busy === "image" ? "Uploading…" : hasImage ? "Replace" : "Upload"}
                </Button>
                {hasImage ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={busy !== null}
                    onClick={() => void removeImage()}
                  >
                    Remove
                  </Button>
                ) : null}
                <p className="w-full text-xs text-muted-foreground">
                  JPEG, PNG, WebP or GIF, up to 5 MB. Shown on the card once it&apos;s flipped.
                </p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Save the riddle first to add an image.
              </p>
            )}
          </div>

          {riddle.qrIdentifier ? (
            <div className="grid gap-2 rounded-lg border border-dashed p-3 text-sm">
              <p className="text-muted-foreground">
                QR code:{" "}
                <span className="font-mono text-foreground">{riddle.qrIdentifier}</span>
              </p>
              {confirmRegenerate ? (
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-destructive">
                    Printed copies of the old code stop working.
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    disabled={busy !== null}
                    onClick={() => void regenerate()}
                  >
                    {busy === "regenerate" ? "Regenerating…" : "Regenerate"}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={busy !== null}
                    onClick={() => setConfirmRegenerate(false)}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="justify-self-start"
                  onClick={() => setConfirmRegenerate(true)}
                >
                  Regenerate QR code
                </Button>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              A QR code is generated when you first save this riddle.
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={busy !== null}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!canSave}>
              {busy === "save" ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
