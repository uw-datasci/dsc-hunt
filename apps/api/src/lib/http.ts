import type { FastifyReply } from "fastify";
import { HttpError } from "./http-error";

/**
 * Runs an action that resolves to a URL and answers with a 302 to it (e.g. a
 * short-lived signed image URL). HttpErrors become `{ error }` responses.
 */
export async function handleRedirect(
  reply: FastifyReply,
  fn: () => Promise<string>,
  maxAgeSeconds = 0
) {
  try {
    const url = await fn();
    // Cache the redirect for less than the signed URL's lifetime.
    reply.header(
      "Cache-Control",
      maxAgeSeconds > 0 ? `private, max-age=${maxAgeSeconds}` : "no-store"
    );
    return reply.redirect(url, 302);
  } catch (err) {
    if (err instanceof HttpError) {
      return reply.code(err.statusCode).send({ error: err.message });
    }
    throw err;
  }
}

// Runs a controller action and sends its result, turning HttpErrors into error responses.
export async function handle<T>(reply: FastifyReply, fn: () => Promise<T>, okCode = 200) {
  try {
    const result = await fn();
    return reply.code(okCode).send(result);
  } catch (err) {
    if (err instanceof HttpError) {
      return reply.code(err.statusCode).send({ error: err.message });
    }
    throw err;
  }
}
