import { withRaft } from "@uw-datasci/raft";
import { forward } from "@/lib/api/forward";

type Ctx = { params: Promise<{ id: string; position: string }> };

export const POST = withRaft<Ctx>(async (request, { params }) => {
  const { id, position } = await params;
  return forward(
    request,
    `/events/${encodeURIComponent(id)}/riddles/${encodeURIComponent(position)}/flip`
  );
});
