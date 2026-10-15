/**
 * Thrown by services to short-circuit with a specific HTTP status. Controllers
 * translate it into `{ error }` JSON via `handle()`; anything else propagates
 * to Fastify's default 500 handler.
 */
export class HttpError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string
  ) {
    super(message);
    this.name = "HttpError";
  }
}
