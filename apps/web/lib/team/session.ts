"use server";

import { cookies } from "next/headers";
import type { PlaceholderTeam } from "@/components/team/placeholder-team";

const COOKIE = "dsc_team";

// TODO: replace with the real team lookup from the DB; the cookie is a stand-in.
export async function getCurrentTeam(): Promise<PlaceholderTeam | null> {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PlaceholderTeam;
  } catch {
    return null;
  }
}

export async function saveCurrentTeam(team: PlaceholderTeam): Promise<void> {
  (await cookies()).set(COOKIE, JSON.stringify(team), { httpOnly: true, sameSite: "lax", path: "/" });
}

export async function clearCurrentTeam(): Promise<void> {
  (await cookies()).delete(COOKIE);
}
