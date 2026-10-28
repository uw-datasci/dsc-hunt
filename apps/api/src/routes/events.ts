import type { FastifyPluginAsync } from "fastify";

import { EventsController } from "../modules/events/events.controller";
import { EventsRepository } from "../modules/events/events.repository";
import { eventsSchema } from "../modules/events/events.schema";
import { EventsService } from "../modules/events/events.service";
import { RiddlesController } from "../modules/riddles/riddles.controller";
import { RiddlesRepository } from "../modules/riddles/riddles.repository";
import type {
  AnswerBody,
  CurrentRiddleParams,
  CurrentScanParams,
  EventParams,
  RiddleParams,
  ScanParams,
} from "../modules/riddles/riddles.types";
import { riddlesSchema } from "../modules/riddles/riddles.schema";
import { RiddlesService } from "../modules/riddles/riddles.service";
import { ScoringRepository } from "../modules/scoring/scoring.repository";
import { ScoringService } from "../modules/scoring/scoring.service";

const eventsRoutes: FastifyPluginAsync = async (fastify) => {
  const eventsRepository = new EventsRepository();
  const service = new EventsService(eventsRepository, fastify.eventHub);
  const controller = new EventsController(service);
  const scoring = new ScoringService(new ScoringRepository(), fastify.eventHub);
  const riddles = new RiddlesController(
    new RiddlesService(
      new RiddlesRepository(),
      eventsRepository,
      fastify.eventHub,
      scoring,
      fastify.storage
    )
  );
  const auth = fastify.requireAuth;

  // Public: status gates the home page and /riddles, and the logged-out
  // leaderboard needs the current event too.
  fastify.get("/events/current", { schema: eventsSchema.getCurrent }, controller.getCurrent);
  fastify.get(
    "/events/:id",
    { schema: eventsSchema.getById, preHandler: auth },
    controller.getById
  );

  // Lifecycle - staff only. Transitions are one-way; anything else is a 409.
  fastify.post(
    "/events/:id/start",
    { schema: eventsSchema.start, preHandler: fastify.requireAdmin },
    controller.start
  );
  fastify.put(
    "/events/:id/starting-location",
    { schema: eventsSchema.setStartingLocation, preHandler: fastify.requireAdmin },
    controller.setStartingLocation
  );
  fastify.post(
    "/events/:id/end",
    { schema: eventsSchema.end, preHandler: fastify.requireAdmin },
    controller.end
  );

  // Team riddle progress. `current` routes resolve to the newest event.
  fastify.get(
    "/events/current/riddles",
    { schema: riddlesSchema.getCurrent, preHandler: auth },
    riddles.getCurrent
  );
  fastify.post<{ Params: CurrentRiddleParams }>(
    "/events/current/riddles/:position/flip",
    { schema: riddlesSchema.flipCurrent, preHandler: auth },
    riddles.flipCurrent
  );
  fastify.post<{ Params: CurrentRiddleParams; Body: AnswerBody }>(
    "/events/current/riddles/:position/answer",
    { schema: riddlesSchema.answerCurrent, preHandler: auth },
    riddles.answerCurrent
  );
  fastify.post<{ Params: CurrentScanParams }>(
    "/events/current/scan/:code",
    { schema: riddlesSchema.scanCurrent, preHandler: auth },
    riddles.scanCurrent
  );
  fastify.get<{ Params: EventParams }>(
    "/events/:id/riddles",
    { schema: riddlesSchema.get, preHandler: auth },
    riddles.get
  );
  fastify.get<{ Params: RiddleParams }>(
    "/events/:id/riddles/:position/image",
    { schema: riddlesSchema.image, preHandler: auth },
    riddles.image
  );
  fastify.post<{ Params: RiddleParams }>(
    "/events/:id/riddles/:position/flip",
    { schema: riddlesSchema.flip, preHandler: auth },
    riddles.flip
  );
  fastify.post<{ Params: RiddleParams; Body: AnswerBody }>(
    "/events/:id/riddles/:position/answer",
    { schema: riddlesSchema.answer, preHandler: auth },
    riddles.answer
  );
  fastify.post<{ Params: ScanParams }>(
    "/events/:id/scan/:code",
    { schema: riddlesSchema.scan, preHandler: auth },
    riddles.scan
  );
};

export default eventsRoutes;
