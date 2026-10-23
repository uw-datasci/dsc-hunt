import assert from "node:assert/strict";
import { test } from "node:test";
import type { DatabaseTransaction } from "@dsc-hunt/db";
import { EventHub } from "../realtime/event-hub";
import { pointsForVisit, ScoringRepository } from "./scoring.repository";
import { ScoringService } from "./scoring.service";

test("points follow the location visit order tiers", () => {
  assert.deepEqual(
    Array.from({ length: 8 }, (_, visited) => pointsForVisit(visited)),
    [100, 75, 50, 25, 25, 10, 10, 10]
  );
});

test("scoreVisit locks the location and publishes only after transaction commit", async () => {
  const statements: Array<{ text: string; params?: ReadonlyArray<unknown> }> = [];
  const callbacks: Array<() => void> = [];
  const transaction: DatabaseTransaction = {
    async query<T>(text: string, params?: ReadonlyArray<unknown>): Promise<T[]> {
      statements.push({ text, params });
      if (text.includes("SELECT visited")) return [{ visited: 0 }] as T[];
      if (text.includes("RETURNING total_score")) {
        return [{ total_score: 100, last_scored_at: "2026-10-23 22:00:00+00" }] as T[];
      }
      return [];
    },
    afterCommit(callback) {
      callbacks.push(callback);
    },
  };
  const published: Array<{ eventId: string; message: unknown }> = [];
  const hub = new EventHub();
  hub.publish = (eventId, message) => published.push({ eventId, message });
  const service = new ScoringService(new ScoringRepository(), hub);

  const result = await service.scoreVisit("event-1", "team-1", "location-1", transaction);

  assert.deepEqual(result, {
    totalScore: 100,
    lastScoredAt: "2026-10-23 22:00:00+00",
  });
  assert.match(statements[0]?.text ?? "", /FOR UPDATE/);
  assert.deepEqual(statements[1]?.params, ["location-1", "team-1", 100]);
  assert.deepEqual(statements[2]?.params, ["location-1"]);
  assert.deepEqual(statements[3]?.params, ["team-1", 100]);
  assert.equal(published.length, 0);

  for (const callback of callbacks) callback();

  assert.deepEqual(published, [
    {
      eventId: "event-1",
      message: {
        type: "score_update",
        eventId: "event-1",
        teamId: "team-1",
        totalScore: 100,
        lastScoredAt: "2026-10-23 22:00:00+00",
      },
    },
  ]);
});
