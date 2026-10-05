import type { EditingPresence } from "@estimathon/types";
import type { EventHub } from "./event-hub";

const TTL_MS = 15_000;
const SWEEP_INTERVAL_MS = 5_000;

interface Entry extends EditingPresence {
  expiresAt: number;
}

function key(eventId: string, teamId: string, questionId: string): string {
  return `${eventId}:${teamId}:${questionId}`;
}

/**
 * In-memory "who's editing this question" presence, keyed by
 * (event, team, question). Broadcasts the full current editor list over the
 * EventHub on every change and expires stale entries so a closed tab or
 * missed "stopped editing" call can't leave a ghost outline behind.
 *
 * One instance per Fastify process (same scaling caveat as EventHub).
 */
export class EditingPresenceStore {
  private readonly entries = new Map<string, Map<string, Entry>>();
  private readonly sweepTimer: ReturnType<typeof setInterval>;

  constructor(private readonly hub: EventHub) {
    this.sweepTimer = setInterval(() => this.sweep(), SWEEP_INTERVAL_MS);
    this.sweepTimer.unref?.();
  }

  touch(eventId: string, teamId: string, questionId: string, editor: EditingPresence) {
    const k = key(eventId, teamId, questionId);
    let set = this.entries.get(k);
    if (!set) {
      set = new Map();
      this.entries.set(k, set);
    }
    set.set(editor.userId, { ...editor, expiresAt: Date.now() + TTL_MS });
    this.publish(eventId, teamId, questionId);
  }

  remove(eventId: string, teamId: string, questionId: string, userId: string) {
    const k = key(eventId, teamId, questionId);
    const set = this.entries.get(k);
    if (!set?.delete(userId)) return;
    if (set.size === 0) this.entries.delete(k);
    this.publish(eventId, teamId, questionId);
  }

  private publish(eventId: string, teamId: string, questionId: string) {
    const set = this.entries.get(key(eventId, teamId, questionId));
    const editors: EditingPresence[] = set
      ? [...set.values()].map(({ userId, name, avatarUrl }) => ({
          userId,
          name,
          avatarUrl,
        }))
      : [];
    this.hub.publish(eventId, {
      type: "editing",
      eventId,
      teamId,
      questionId,
      editors,
    });
  }

  private sweep() {
    const now = Date.now();
    for (const [k, set] of this.entries) {
      let changed = false;
      for (const [userId, entry] of set) {
        if (entry.expiresAt <= now) {
          set.delete(userId);
          changed = true;
        }
      }
      if (!changed) continue;
      if (set.size === 0) this.entries.delete(k);
      const [eventId, teamId, questionId] = k.split(":");
      if (eventId && teamId && questionId) {
        this.publish(eventId, teamId, questionId);
      }
    }
  }

  dispose() {
    clearInterval(this.sweepTimer);
  }
}
