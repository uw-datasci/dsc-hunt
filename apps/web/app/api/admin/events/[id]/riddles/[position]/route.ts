import { withRaft } from "@uw-datasci/raft";
import { forward } from "@/lib/api/forward";

type Ctx = { params: Promise<{ id: string; position: string }> };

/** Saves the riddle + location at a position. The API enforces staff-only and the pre-start lock. */
export const PUT = withRaft<Ctx>(async (request, { params }) => {
  const { id, position } = await params;
  return forward(
    request,
    `/events/${encodeURIComponent(id)}/admin/riddles/${encodeURIComponent(position)}`
  );
});
