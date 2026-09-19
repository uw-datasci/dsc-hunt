import { SystemRepository } from "./system.repository"

export class SystemService {
  constructor(private readonly repository: SystemRepository) {}

  getHealth() {
    return this.repository.getHealthRecord()
  }

  getWelcomeMessage() {
    return this.repository.getWelcomeRecord()
  }
}
