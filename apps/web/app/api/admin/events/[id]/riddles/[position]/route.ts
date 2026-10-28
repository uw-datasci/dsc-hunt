import { NextResponse } from "next/server";
import type { AdminRiddle } from "@dsc-hunt/types";
import { proxyApiJson } from "@/lib/api/proxy";

/** Saves the riddle + location at a position. The API enforces staff-only and the pre-start lock. */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; position: string }> }
) {
  const { id, position } = await params;
  const { status, data, error } = await proxyApiJson<{ riddle: AdminRiddle }>(
    `/events/${encodeURIComponent(id)}/admin/riddles/${encodeURIComponent(position)}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: await request.text(),
    }
  );
  return NextResponse.json(data ?? { error }, { status });
}
