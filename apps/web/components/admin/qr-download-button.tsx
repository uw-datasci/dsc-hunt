"use client";

import { useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Button } from "@dsc-hunt/ui/components/button";

interface QrDownloadButtonProps {
  readonly url: string;
  /** Used for the file name, e.g. `riddle-3-mc-atrium.png`. */
  readonly position: number;
  readonly locationName: string;
}

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Downloads a high-resolution PNG of a location's QR code. */
export function QrDownloadButton({ url, position, locationName }: QrDownloadButtonProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  function download() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `riddle-${position}-${slug(locationName) || "location"}.png`;
    link.click();
  }

  return (
    <>
      <QRCodeCanvas
        ref={canvasRef}
        value={url}
        size={1024}
        marginSize={4}
        level="M"
        className="hidden"
        aria-hidden
      />
      <Button variant="ghost" size="sm" onClick={download}>
        PNG
      </Button>
    </>
  );
}
