import { withRaft } from "@uw-datasci/raft";
import { forward } from "@/lib/api/forward";

type Ctx = { params: Promise<{ position: string }> };

export const POST = withRaft<Ctx>(async (request, { params }) => {
  const { position } = await params;
  return forward(request, `/events/current/riddles/${encodeURIComponent(position)}/answer`);
});
