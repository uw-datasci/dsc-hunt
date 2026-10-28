import { NextResponse } from "next/server";
import type { AdminProgressResponse } from "@dsc-hunt/types";
import { proxyApiJson } from "@/lib/api/proxy";

export const dynamic = "force-dynamic";

/** Live progress for the admin view. Staff only (enforced by the API). */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { status, data, error } = await proxyApiJson<AdminProgressResponse>(
    `/events/${encodeURIComponent(id)}/admin/progress`,
    { cache: "no-store" }
  );
  return NextResponse.json(data ?? { error }, { status });
}
