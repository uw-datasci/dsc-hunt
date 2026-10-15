import { NextResponse } from "next/server";
import { proxyApiJson } from "@/lib/api/proxy";
import type { Event } from "@dsc-hunt/types";

/**
 * Starts the hunt. The API enforces staff-only (403) and the
 * not_started -> live transition (409 otherwise).
 */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { status, data, error } = await proxyApiJson<{ event: Event }>(
    `/events/${encodeURIComponent(id)}/start`,
    { method: "POST" }
  );
  return NextResponse.json(data ?? { error }, { status });
}
