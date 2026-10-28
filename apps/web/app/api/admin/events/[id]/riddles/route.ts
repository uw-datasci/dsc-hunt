import { NextResponse } from "next/server";
import type { AdminRiddle } from "@dsc-hunt/types";
import { proxyApiJson } from "@/lib/api/proxy";

export const dynamic = "force-dynamic";

/** All 6 riddle positions with answers and QR codes. Staff only (enforced by the API). */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { status, data, error } = await proxyApiJson<{ riddles: AdminRiddle[] }>(
    `/events/${encodeURIComponent(id)}/admin/riddles`
  );
  return NextResponse.json(data ?? { error }, { status });
}
