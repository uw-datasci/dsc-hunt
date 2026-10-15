import { NextResponse } from "next/server";
import { proxyApiJson } from "@/lib/api/proxy";
import type { Event } from "@dsc-hunt/types";

/**
 * Ends the hunt. The API enforces staff-only (403) and the live -> ended
 * transition (409 otherwise). There is no restart.
 */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { status, data, error } = await proxyApiJson<{ event: Event }>(
    `/events/${encodeURIComponent(id)}/end`,
    { method: "POST" }
  );
  return NextResponse.json(data ?? { error }, { status });
}
