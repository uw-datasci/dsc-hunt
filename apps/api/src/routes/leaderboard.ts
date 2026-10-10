import { EventsRepository } from "../modules/events/events.repository";
import { LeaderboardController } from "../modules/leaderboard/leaderboard.controller";
import { LeaderboardService } from "../modules/leaderboard/leaderboard.service";
import { leaderboardSchema } from "../modules/leaderboard/leaderboard.schema";
import { QuestionsRepository } from "../modules/questions/questions.repository";
import { SubmissionsRepository } from "../modules/submissions/submissions.repository";
import { TeamsRepository } from "../modules/teams/teams.repository";
import type { FastifyInstance } from "fastify";

export default async function leaderboardRoute(server: FastifyInstance) {
  const teams = new TeamsRepository();
  const submissions = new SubmissionsRepository();
  const questions = new QuestionsRepository();
  const events = new EventsRepository();

  const service = new LeaderboardService(
    teams,
    submissions,
    questions,
    events
  );

  const controller = new LeaderboardController(service);

  server.get(
    "/events/:id/leaderboard",
    {
      schema: leaderboardSchema.getForEvent,
    },
    controller.getForEvent
  );
}