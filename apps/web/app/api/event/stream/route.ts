import { getAuthenticatedUser } from "@/lib/auth/session";
import { getEventStatus, subscribeEventStatus, type EventStatus } from "@/lib/event/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return new Response("Unauthenticated", { status: 401 });

  const encoder = new TextEncoder();
  let cleanup = () => {};

  const stream = new ReadableStream({
    start(controller) {
      const send = (status: EventStatus) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ status })}\n\n`));

      send(getEventStatus());
      const unsubscribe = subscribeEventStatus(send);
      const keepAlive = setInterval(
        () => controller.enqueue(encoder.encode(": ping\n\n")),
        25_000,
      );

      cleanup = () => {
        clearInterval(keepAlive);
        unsubscribe();
      };
      request.signal.addEventListener("abort", () => {
        cleanup();
        controller.close();
      });
    },
    cancel() {
      cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
