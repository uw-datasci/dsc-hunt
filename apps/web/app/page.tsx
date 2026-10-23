import { LandingHero } from "@/components/marketing/landing-hero";
import { buildLoginUrl } from "@/lib/auth/login-url";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { getCurrentEvent } from "@/lib/event/current";
import { isStaffRole } from "@dsc-hunt/types";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const user = await getAuthenticatedUser();
  const event = user ? await getCurrentEvent() : null;

  const session = user
    ? {
        name: [user.firstName, user.lastName].filter(Boolean).join(" ") || null,
        isStaff: isStaffRole(user.role),
        eventStatus: event?.status ?? "not_started",
      }
    : null;

  const loginUrl = await buildLoginUrl();

  return <LandingHero loginUrl={loginUrl} session={session} />;
}
