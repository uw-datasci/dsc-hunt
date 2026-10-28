import { NextResponse } from "next/server";
import { proxyApiJson } from "@/lib/api/proxy";
import type { Event } from "@dsc-hunt/types";

/**
 * Creates a new hunt. The API enforces staff-only (403) and that the current
 * hunt has ended (409 otherwise).
 */
export async function POST(request: Request) {
  const { status, data, error } = await proxyApiJson<{ event: Event }>("/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: await request.text(),
  });
  return NextResponse.json(data ?? { error }, { status });
}
