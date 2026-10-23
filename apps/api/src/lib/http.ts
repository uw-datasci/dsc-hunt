import type { FastifyReply } from "fastify";
import { HttpError } from "./http-error";

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
