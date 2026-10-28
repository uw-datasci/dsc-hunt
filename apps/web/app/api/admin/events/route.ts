import { withRaft } from "@uw-datasci/raft";
import { forward } from "@/lib/api/forward";

/**
 * Creates a new hunt. The API enforces staff-only (403) and that the current
 * hunt has ended (409 otherwise).
 */
export const POST = withRaft(async (request) => {
  return forward(request, "/events");
});
