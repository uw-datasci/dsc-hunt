import { withTransaction, type DatabaseTransaction } from "@dsc-hunt/db";
import type { EventHub } from "../realtime/event-hub";
import type { ScoredVisit, ScoringRepository } from "./scoring.repository";

export class ScoringService {
  constructor(
    private readonly repository: ScoringRepository,
    private readonly hub: EventHub
  ) {}

  scoreVisit(
    eventId: string,
    teamId: string,
    locationId: string,
    transaction?: DatabaseTransaction
  ): Promise<ScoredVisit> {
    const score = async (tx: DatabaseTransaction) => {
      const result = await this.repository.scoreVisit(tx, teamId, locationId);
      tx.afterCommit(() => {
        this.hub.publish(eventId, {
          type: "score_update",
          eventId,
          teamId,
          totalScore: result.totalScore,
          lastScoredAt: result.lastScoredAt,
        });
      });
      return result;
    };

    return transaction ? score(transaction) : withTransaction(score);
  }
}
