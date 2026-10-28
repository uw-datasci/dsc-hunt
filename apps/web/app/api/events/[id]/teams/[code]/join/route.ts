import { withRaft } from "@uw-datasci/raft";
import { forward } from "@/lib/api/forward";

type Ctx = { params: Promise<{ id: string; code: string }> };

export const POST = withRaft<Ctx>(async (request, { params }) => {
  const { id, code } = await params;
  return forward(
    request,
    `/events/${encodeURIComponent(id)}/teams/${encodeURIComponent(code)}/join`
  );
});
