import { LandingHero } from "@/components/marketing/landing-hero";
import { buildLoginUrl } from "@/lib/auth/login-url";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { getCurrentEvent } from "@/lib/event/current";
import { isStaffRole } from "@dsc-hunt/types";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  // The current event is public, so logged-out visitors also see the venue.
  const [user, event] = await Promise.all([getAuthenticatedUser(), getCurrentEvent()]);

  const session = user
    ? {
        name: [user.firstName, user.lastName].filter(Boolean).join(" ") || null,
        isStaff: isStaffRole(user.role),
        eventStatus: event?.status ?? "not_started",
      }
    : null;

  const loginUrl = await buildLoginUrl();

  return <LandingHero loginUrl={loginUrl} session={session} event={event} />;
}
