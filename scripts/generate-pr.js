#!/usr/bin/env node
// scripts/generate-pr.js — CLI runner (Orchestrator)
// Usage: node scripts/generate-pr.js --diff "$(git diff HEAD~1)" [--why "Ticket ABC-123"]

import "dotenv/config";
import { generateDescription } from "../src/llm.js";

function parseArgs() {
  const args = process.argv.slice(2);
  const result = { diff: "", commits: "", why: "" };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--diff" && args[i + 1]) result.diff = args[++i];
    if (args[i] === "--commits" && args[i + 1]) result.commits = args[++i];
    if (args[i] === "--why" && args[i + 1]) result.why = args[++i];
    if (args[i] === "--demo") result.demo = true;
  }
  return result;
}

// Demo diff để test không cần git repo thật
const DEMO_DIFF = `
commit a3f8c21
feat: add JWT refresh token rotation with Redis

diff --git a/src/auth/jwt.service.ts b/src/auth/jwt.service.ts
index 2b4c1f0..9e8d3a2 100644
--- a/src/auth/jwt.service.ts
+++ b/src/auth/jwt.service.ts
@@ -15,6 +15,31 @@ export class JwtService {
   constructor(private redis: RedisService) {}

+  async generateTokenPair(userId: string): Promise<TokenPair> {
+    const accessToken = this.jwt.sign({ sub: userId }, { expiresIn: '15m' });
+    const refreshToken = crypto.randomBytes(64).toString('hex');
+    const hashedRefresh = await bcrypt.hash(refreshToken, 10);
+    await this.redis.set(\`refresh:\${userId}\`, hashedRefresh, 'EX', 60 * 60 * 24 * 7);
+    return { accessToken, refreshToken };
+  }
+
+  async rotateRefreshToken(userId: string, token: string): Promise<TokenPair> {
+    const stored = await this.redis.get(\`refresh:\${userId}\`);
+    if (!stored || !(await bcrypt.compare(token, stored))) {
+      await this.redis.del(\`refresh:\${userId}\`);
+      throw new UnauthorizedException('Refresh token reuse detected');
+    }
+    return this.generateTokenPair(userId);
+  }
`.trim();

async function main() {
  const args = parseArgs();
  const diffInput = args.demo ? DEMO_DIFF : args.diff;

  if (!diffInput && !args.commits) {
    console.error("❌ Error: Provide --diff, --commits, or use --demo for a sample run");
    process.exit(1);
  }

  console.log("🤖 PR Description Generator Agent");
  console.log("━".repeat(50));
  console.log(args.demo ? "📋 Running with demo diff..." : "📋 Analyzing diff...");
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
