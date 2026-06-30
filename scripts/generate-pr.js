#!/usr/bin/env node
// scripts/generate-pr.js — CLI runner (Orchestrator)
// Cách dùng: node scripts/generate-pr.js --diff "$(git diff HEAD~1)" [--why "Ticket ABC-123"]

import "dotenv/config";
import { generateDescription } from "../src/llm.js";

// Đọc các tham số dòng lệnh: --diff, --commits, --why
function parseArgs() {
  const args = process.argv.slice(2);
  const result = { diff: "", commits: "", why: "" };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--diff" && args[i + 1]) result.diff = args[++i];
    if (args[i] === "--commits" && args[i + 1]) result.commits = args[++i];
    if (args[i] === "--why" && args[i + 1]) result.why = args[++i];
  }
  return result;
}

async function main() {
  const args = parseArgs();
  const diffInput = args.diff;

  if (!diffInput && !args.commits) {
    console.error("❌ Error: Provide --diff or --commits");
    process.exit(1);
  }

  console.log("🤖 PR Description Generator Agent");
  console.log("━".repeat(50));
  console.log("📋 Analyzing diff...");
  console.log();

  const { text, usage } = await generateDescription({
    diff: diffInput,
    commits: args.commits,
    why: args.why,
  });

  console.log(text);
  console.log();
  console.log("━".repeat(50));
  console.log(`✅ Done! (${usage?.completion_tokens ?? "?"} output tokens)`);
}

main().catch((err) => {
  console.error("❌ Agent error:", err.message);
  process.exit(1);
});
