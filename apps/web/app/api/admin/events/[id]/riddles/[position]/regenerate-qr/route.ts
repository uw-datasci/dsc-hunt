import { withRaft } from "@uw-datasci/raft";
import { forward } from "@/lib/api/forward";

type Ctx = { params: Promise<{ id: string; position: string }> };

/** Issues a new QR code for a position; previously printed codes stop working. */
export const POST = withRaft<Ctx>(async (request, { params }) => {
  const { id, position } = await params;
  return forward(
    request,
    `/events/${encodeURIComponent(id)}/admin/riddles/${encodeURIComponent(position)}/regenerate-qr`
  );
});
