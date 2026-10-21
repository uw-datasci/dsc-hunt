import type { FastifyReply, FastifyRequest } from "fastify";
import { handle } from "../../lib/http";
import type { RiddlesService } from "./riddles.service";
import type {
  AnswerBody,
  CurrentRiddleParams,
  CurrentScanParams,
  EventParams,
  RiddleParams,
  ScanParams,
} from "./riddles.types";

export class RiddlesController {
  constructor(private readonly service: RiddlesService) {
    this.get = this.get.bind(this);
    this.getCurrent = this.getCurrent.bind(this);
    this.flip = this.flip.bind(this);
    this.flipCurrent = this.flipCurrent.bind(this);
    this.answer = this.answer.bind(this);
    this.answerCurrent = this.answerCurrent.bind(this);
    this.scan = this.scan.bind(this);
    this.scanCurrent = this.scanCurrent.bind(this);
  }

  get(request: FastifyRequest<{ Params: EventParams }>, reply: FastifyReply) {
    return handle(reply, () => this.service.getProgress(request.params.id, request.user!.id));
  }

  getCurrent(request: FastifyRequest, reply: FastifyReply) {
    return handle(reply, () => this.service.getCurrentProgress(request.user!.id));
  }

  flip(request: FastifyRequest<{ Params: RiddleParams }>, reply: FastifyReply) {
    const { id, position } = request.params;
    return handle(reply, () => this.service.flip(id, position, request.user!.id));
  }

  flipCurrent(request: FastifyRequest<{ Params: CurrentRiddleParams }>, reply: FastifyReply) {
    return handle(reply, async () => {
      const eventId = await this.service.getCurrentEventId();
      return this.service.flip(eventId, request.params.position, request.user!.id);
    });
  }

  answer(
    request: FastifyRequest<{ Params: RiddleParams; Body: AnswerBody }>,
    reply: FastifyReply
  ) {
    const { id, position } = request.params;
    return handle(reply, () =>
      this.service.answer(id, position, request.body.answer, request.user!.id)
    );
  }

  answerCurrent(
    request: FastifyRequest<{ Params: CurrentRiddleParams; Body: AnswerBody }>,
    reply: FastifyReply
  ) {
    return handle(reply, async () => {
      const eventId = await this.service.getCurrentEventId();
      return this.service.answer(
        eventId,
        request.params.position,
        request.body.answer,
        request.user!.id
      );
    });
  }

  scan(request: FastifyRequest<{ Params: ScanParams }>, reply: FastifyReply) {
    const { id, code } = request.params;
    return handle(reply, () => this.service.scan(id, code, request.user!.id));
  }

  scanCurrent(request: FastifyRequest<{ Params: CurrentScanParams }>, reply: FastifyReply) {
    return handle(reply, async () => {
      const eventId = await this.service.getCurrentEventId();
      return this.service.scan(eventId, request.params.code, request.user!.id);
    });
  }
}
