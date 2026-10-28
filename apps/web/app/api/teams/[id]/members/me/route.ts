import { withRaft } from "@uw-datasci/raft";
import { forward } from "@/lib/api/forward";

type Ctx = { params: Promise<{ id: string }> };

export const DELETE = withRaft<Ctx>(async (request, { params }) => {
  const { id } = await params;
  return forward(request, `/teams/${encodeURIComponent(id)}/members/me`);
});
