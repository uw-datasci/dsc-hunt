import { NextResponse } from "next/server";
import { proxyApiJson } from "@/lib/api/proxy";
import type { Event } from "@dsc-hunt/types";

/**
 * Sets the starting location (event venue). The API enforces staff-only (403)
 * and that the hunt hasn't started (409).
 */
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { status, data, error } = await proxyApiJson<{ event: Event }>(
    `/events/${encodeURIComponent(id)}/starting-location`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: await request.text(),
    }
  );
  return NextResponse.json(data ?? { error }, { status });
}
