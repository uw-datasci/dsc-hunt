import { NextResponse } from "next/server";
import { proxyApiJson } from "@/lib/api/proxy";

/** Issues a new QR code for a position; previously printed codes stop working. */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string; position: string }> }
) {
  const { id, position } = await params;
  const { status, data, error } = await proxyApiJson<{ qrIdentifier: string }>(
    `/events/${encodeURIComponent(id)}/admin/riddles/${encodeURIComponent(position)}/regenerate-qr`,
    { method: "POST" }
  );
  return NextResponse.json(data ?? { error }, { status });
}
