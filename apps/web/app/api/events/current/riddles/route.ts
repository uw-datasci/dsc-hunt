import { withRaft } from "@uw-datasci/raft";
import { forward } from "@/lib/api/forward";

export const dynamic = "force-dynamic";

export const GET = withRaft(async (request) => {
  return forward(request, "/events/current/riddles");
});
