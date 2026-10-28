import type { FastifyPluginAsync } from "fastify";

import { EventsRepository } from "../modules/events/events.repository";
import { TeamsController } from "../modules/teams/teams.controller";
import { TeamsRepository } from "../modules/teams/teams.repository";
import { teamsSchema } from "../modules/teams/teams.schema";
import { TeamsService } from "../modules/teams/teams.service";
import type {
  CreateTeamBody,
  EventParams,
  JoinParams,
  TeamParams,
} from "../modules/teams/teams.types";
import { StatsPublisher } from "../modules/stats/stats.publisher";
import { StatsRepository } from "../modules/stats/stats.repository";

const teamsRoutes: FastifyPluginAsync = async (fastify) => {
  const service = new TeamsService(
    new TeamsRepository(),
    new EventsRepository(),
    fastify.eventHub,
    new StatsPublisher(new StatsRepository(), fastify.eventHub, fastify.log)
  );
  const controller = new TeamsController(service);
  const auth = fastify.requireAuth;

  fastify.post<{ Params: EventParams; Body: CreateTeamBody | undefined }>(
    "/events/:id/teams",
    { schema: teamsSchema.create, preHandler: auth },
    controller.create
  );
  fastify.post<{ Params: JoinParams }>(
    "/events/:id/teams/:code/join",
    { schema: teamsSchema.join, preHandler: auth },
    controller.join
  );
  fastify.get<{ Params: EventParams }>(
    "/events/:id/team",
    { schema: teamsSchema.getMine, preHandler: auth },
    controller.getMine
  );
  fastify.get<{ Params: TeamParams }>(
    "/teams/:id",
    { schema: teamsSchema.getDetail, preHandler: auth },
    controller.getDetail
  );
  fastify.delete<{ Params: TeamParams }>(
    "/teams/:id/members/me",
    { schema: teamsSchema.leave, preHandler: auth },
    controller.leave
  );
};

export default teamsRoutes;
