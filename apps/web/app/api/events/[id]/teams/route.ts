import { withRaft } from "@uw-datasci/raft";
import { forward } from "@/lib/api/forward";

type Ctx = { params: Promise<{ id: string }> };

export const POST = withRaft<Ctx>(async (request, { params }) => {
  const { id } = await params;
  // Fastify rejects an empty JSON body, and the team name is optional.
  return forward(request, `/events/${encodeURIComponent(id)}/teams`, { emptyBody: "{}" });
});
