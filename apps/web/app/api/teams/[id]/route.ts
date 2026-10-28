import { withRaft } from "@uw-datasci/raft";
import { forward } from "@/lib/api/forward";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export const GET = withRaft<Ctx>(async (request, { params }) => {
  const { id } = await params;
  return forward(request, `/teams/${encodeURIComponent(id)}`);
});
