import { LandingHero } from "@/components/marketing/landing-hero";
import { buildLoginUrl } from "@/lib/auth/login-url";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { isStaffRole } from "@dsc-hunt/types";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const user = await getAuthenticatedUser();

  const session = user
    ? {
        name: [user.firstName, user.lastName].filter(Boolean).join(" ") || null,
        isStaff: isStaffRole(user.role),
      }
    : null;

  const loginUrl = await buildLoginUrl();

  return <LandingHero loginUrl={loginUrl} session={session} />;
}
