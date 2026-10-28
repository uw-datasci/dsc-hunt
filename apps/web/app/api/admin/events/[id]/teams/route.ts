import { NextResponse } from "next/server";
import type { AdminTeam } from "@dsc-hunt/types";
import { proxyApiJson } from "@/lib/api/proxy";

export const dynamic = "force-dynamic";

/** Every team with member / scan / score counts. Staff only (enforced by the API). */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { status, data, error } = await proxyApiJson<{ teams: AdminTeam[] }>(
    `/events/${encodeURIComponent(id)}/admin/teams`
  );
  return NextResponse.json(data ?? { error }, { status });
}
