import { NextResponse } from "next/server";
import { isStaffRole } from "@dsc-hunt/types";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { getEventStatus, setEventStatus, type EventStatus } from "@/lib/event/store";

export const dynamic = "force-dynamic";

const STATUSES: readonly EventStatus[] = ["not_started", "live", "ended"];

export async function GET() {
  return NextResponse.json({ status: getEventStatus() });
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  if (!isStaffRole(user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await request.json().catch(() => null)) as { status?: string } | null;
  const status = STATUSES.find((s) => s === body?.status);
  if (!status) return NextResponse.json({ error: "Invalid status" }, { status: 400 });

  setEventStatus(status);
  return NextResponse.json({ status });
}
