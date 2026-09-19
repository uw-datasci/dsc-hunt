#!/usr/bin/env node

import { spawn } from "node:child_process";
import path, { dirname } from "node:path";
import { fileURLToPath } from "node:url";

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get the component name from command line arguments
const componentName = process.argv[2];

if (!componentName) {
  console.error("❌ Error: Please specify a component name");
  console.log("Usage: npm run ui:add <component-name>");
  console.log("Example: npm run ui:add button");
  process.exit(1);
}

// Change to project root directory (where components.json is located)
const projectRoot = path.join(__dirname, "..");

console.log(`🔧 Adding shadcn component: ${componentName}`);
console.log(`📁 Working directory: ${projectRoot}`);

// Run the shadcn command
const child = spawn("pnpm", ["dlx", "shadcn@latest", "add", componentName], {
  cwd: projectRoot,
  stdio: "inherit",
  shell: true,
});

child.on("error", (error) => {
  console.error("❌ Error running command:", error.message);
  process.exit(1);
});

child.on("exit", (code) => {
  if (code === 0) {
    console.log(`✅ Successfully added ${componentName} component!`);
  } else {
    console.error(`❌ Command failed with exit code ${code}`);
    process.exit(code);
  }
});
