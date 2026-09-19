import type { HealthRecord, WelcomeRecord } from "./system.types"

export class SystemRepository {
  getHealthRecord(): HealthRecord {
    return { status: "ok" }
  }

  getWelcomeRecord(): WelcomeRecord {
    return { message: "Fastify API is running" }
  }
}
