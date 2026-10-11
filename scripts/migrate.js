#!/usr/bin/env node

/**
 * Database Migration Runner
 *
 * This script handles running db-migrate with proper environment variable loading
 * for both development and production environments.
 */

import { spawn } from "node:child_process";
import path, { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import dotenv from "dotenv";

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const repoRoot = path.join(__dirname, "..");
const dbPackageDir = path.join(repoRoot, "packages", "db");

// Determine environment
const isProduction = process.env.NODE_ENV === "production";
const isCI = process.env.CI === "true";

// Load appropriate .env file for development
if (!isProduction && !isCI) {
  const dbEnvPath = path.join(dbPackageDir, ".env.local");
  const rootEnvPath = path.join(repoRoot, ".env.local");

  let envLoaded = false;

  if (fs.existsSync(dbEnvPath)) {
    dotenv.config({ path: dbEnvPath });
    console.log("✓ Loaded environment from packages/db/.env.local");
    envLoaded = true;
  }

  if (fs.existsSync(rootEnvPath)) {
    dotenv.config({ path: rootEnvPath });
    console.log("✓ Loaded environment from .env.local");
    envLoaded = true;
  }

  if (!envLoaded) {
    console.warn("⚠ Warning: .env.local not found");
    console.warn("  Checked: packages/db/.env.local and .env.local");
    console.warn("  Run `pnpm pull-secrets` or set DATABASE_URL in your environment\n");
  }
} else {
  console.log(`✓ Running in ${isProduction ? "production" : "CI"} mode`);
}

// Verify DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.error("❌ ERROR: DATABASE_URL environment variable is not set");
  console.error("\nFor development, make sure you have .env.local with:");
  console.error("  DATABASE_URL=postgresql://...\n");
  process.exit(1);
}

// Migrations live in packages/db/src/migrations (relative to db package cwd)
const migrationsDir = "src/migrations";

// Get the command (up, down, reset, etc.)
const command = process.argv[2] || "up";
const args = process.argv.slice(3);

console.log(`\n🔄 Running database migration: ${command}\n`);

// Always use migrations dir in the db package; for create, add --sql-file
let dbMigrateArgs = ["-m", migrationsDir, command, ...args];
if (command === "create" && !args.includes("--sql-file")) {
  dbMigrateArgs.push("--sql-file");
}

// Run db-migrate from packages/db so database.json and migrations resolve correctly
const dbMigrate = spawn(
  "pnpm",
  ["exec", "db-migrate", ...dbMigrateArgs],
  {
    stdio: "inherit",
    env: process.env,
    shell: true,
    cwd: dbPackageDir,
  }
);

dbMigrate.on("close", (code) => {
  if (code === 0) {
    console.log("\n✅ Migration completed successfully\n");
  } else {
    console.error(`\n❌ Migration failed with exit code ${code}\n`);
    process.exit(code);
  }
});

dbMigrate.on("error", (err) => {
  console.error("❌ Failed to start migration process:", err);
  process.exit(1);
});
