"use client";

import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@dsc-hunt/ui/components/button";

interface PrintSheetProps {
  readonly eventName: string;
  readonly codes: { position: number; locationName: string; url: string }[];
}

/**
 * One QR code per printed page. On screen it's a stack of white "pages" with
 * a toolbar; print CSS hides the toolbar and breaks a page after each code.
 * The QRs are black on white regardless of the dark theme, so they scan.
 */
export function PrintSheet({ eventName, codes }: PrintSheetProps) {
  return (
    <div className="min-h-svh bg-muted py-8 print:bg-white print:py-0">
      <div className="mx-auto mb-6 flex max-w-xl items-center justify-between gap-4 px-6 print:hidden">
        <Link
          href="/admin/riddles"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to riddles
        </Link>
        <Button onClick={() => window.print()}>Print {codes.length} QR codes</Button>
      </div>

      {codes.map((code) => (
        <section
          key={code.position}
          className="mx-auto mb-8 flex max-w-xl flex-col items-center gap-6 rounded-xl bg-white p-12 text-center text-black shadow print:mb-0 print:min-h-svh print:max-w-none print:break-after-page print:justify-center print:rounded-none print:shadow-none"
        >
          <p className="text-sm tracking-[0.3em] uppercase">{eventName}</p>
          <p className="text-4xl font-semibold">Riddle {code.position}</p>
          <QRCodeSVG value={code.url} size={360} marginSize={4} level="M" />
          <p className="text-2xl font-medium">{code.locationName}</p>
          <p className="text-sm">Scan with your phone camera to check in.</p>
          <p className="font-mono text-xs break-all text-neutral-500">{code.url}</p>
        </section>
      ))}
    </div>
  );
}
