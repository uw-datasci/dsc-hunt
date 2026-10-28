import { withRaft } from "@uw-datasci/raft";
import { forward } from "@/lib/api/forward";

type Ctx = { params: Promise<{ code: string }> };

export const POST = withRaft<Ctx>(async (request, { params }) => {
  const { code } = await params;
  return forward(request, `/events/current/scan/${encodeURIComponent(code)}`);
});
