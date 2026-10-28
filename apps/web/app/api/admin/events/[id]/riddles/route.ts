import { withRaft } from "@uw-datasci/raft";
import { forward } from "@/lib/api/forward";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** All 6 riddle positions with answers and QR codes. Staff only (enforced by the API). */
export const GET = withRaft<Ctx>(async (request, { params }) => {
  const { id } = await params;
  return forward(request, `/events/${encodeURIComponent(id)}/admin/riddles`);
});
