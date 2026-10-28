import type { FastifyReply, FastifyRequest } from "fastify";
import { handle, handleRedirect } from "../../lib/http";
import { SIGNED_URL_SECONDS } from "../../plugins/storage";
import type { AdminRiddlesService } from "./admin-riddles.service";
import type { RiddleParams, SaveRiddleBody, UploadedImage } from "./admin-riddles.types";

/** Reads the single uploaded file. Undefined if the request isn't a multipart upload. */
async function readUpload(request: FastifyRequest): Promise<UploadedImage | undefined> {
  let file;
  try {
    file = await request.file();
  } catch {
    return undefined; // not multipart / malformed
  }
  if (!file) return undefined;
  try {
    return { data: await file.toBuffer(), truncated: false };
  } catch (error) {
    // @fastify/multipart throws once the stream passes the configured fileSize.
    if ((error as { code?: string }).code === "FST_REQ_FILE_TOO_LARGE") {
      return { data: Buffer.alloc(0), truncated: true };
    }
    throw error;
  }
}

export class AdminRiddlesController {
  constructor(private readonly service: AdminRiddlesService) {
    this.list = this.list.bind(this);
    this.save = this.save.bind(this);
    this.regenerateQr = this.regenerateQr.bind(this);
    this.uploadImage = this.uploadImage.bind(this);
    this.removeImage = this.removeImage.bind(this);
    this.image = this.image.bind(this);
  }

  async uploadImage(request: FastifyRequest<{ Params: RiddleParams }>, reply: FastifyReply) {
    const { id, position } = request.params;
    const file = await readUpload(request);
    return handle(reply, () => this.service.uploadImage(id, position, file));
  }

  removeImage(request: FastifyRequest<{ Params: RiddleParams }>, reply: FastifyReply) {
    const { id, position } = request.params;
    return handle(reply, () => this.service.removeImage(id, position));
  }

  /** 302 to a short-lived signed URL for the admin preview. */
  image(request: FastifyRequest<{ Params: RiddleParams }>, reply: FastifyReply) {
    const { id, position } = request.params;
    return handleRedirect(
      reply,
      () => this.service.imageUrl(id, position),
      SIGNED_URL_SECONDS - 60
    );
  }

  list(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    return handle(reply, async () => ({ riddles: await this.service.list(request.params.id) }));
  }

  save(
    request: FastifyRequest<{ Params: RiddleParams; Body: SaveRiddleBody }>,
    reply: FastifyReply
  ) {
    const { id, position } = request.params;
    return handle(reply, async () => ({
      riddle: await this.service.save(id, position, request.body),
    }));
  }

  regenerateQr(request: FastifyRequest<{ Params: RiddleParams }>, reply: FastifyReply) {
    const { id, position } = request.params;
    return handle(reply, () => this.service.regenerateQr(id, position));
  }
}
