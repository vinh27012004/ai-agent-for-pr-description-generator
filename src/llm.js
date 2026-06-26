// src/llm.js
// Model layer: gọi 9router qua chuẩn OpenAI-compatible.
// Cấu hình hoàn toàn bằng biến môi trường để không hardcode endpoint/key.

import OpenAI from "openai";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const AGENTS_DIR = join(__dirname, "../agents");
const SKILLS_DIR = join(__dirname, "../skills");

// --- 9router client (OpenAI compatible) ---------------------------------
// baseURL ví dụ: https://api.9router.xyz/v1  (điền giá trị thật trong .env)
const client = new OpenAI({
  baseURL: process.env.LLM_BASE_URL, // bắt buộc: endpoint 9router
  apiKey: process.env.LLM_API_KEY, // bắt buộc: API key 9router
});

const MODEL = process.env.LLM_MODEL || "claude-sonnet-4-6";

// --- prompt-as-config: load agent + skills từ file .md ------------------
export function loadPromptConfig() {
  const agent = readFileSync(join(AGENTS_DIR, "pr-description-agent.md"), "utf8");
  const skillAnalyze = readFileSync(join(SKILLS_DIR, "analyze_diff.md"), "utf8");
  const skillGenerate = readFileSync(join(SKILLS_DIR, "generate_pr_description.md"), "utf8");
  const skillChecklist = readFileSync(join(SKILLS_DIR, "generate_checklist.md"), "utf8");
  return { agent, skillAnalyze, skillGenerate, skillChecklist };
}

export function buildSystemPrompt(config) {
  return `${config.agent}

---
# Available Skills

${config.skillAnalyze}

---

${config.skillGenerate}

---

${config.skillChecklist}

---

# Final Instructions
Bạn có đầy đủ 3 skills trên. Khi nhận được git diff và/hoặc commit messages, hãy thực hiện đúng workflow trong Agent definition và trả về PR description hoàn chỉnh bằng Markdown.
`;
}

export function buildUserMessage({ diff = "", commits = "", why = "" }) {
  return [
    diff ? `## Git Diff\n\`\`\`diff\n${diff}\n\`\`\`` : "",
    commits ? `## Commit Messages\n${commits}` : "",
    why ? `## Additional Context (Why)\n${why}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

// --- gọi model ----------------------------------------------------------
export async function generateDescription({ diff, commits, why }) {
  const config = loadPromptConfig();
  const systemPrompt = buildSystemPrompt(config);
  const userMessage = buildUserMessage({ diff, commits, why });

  const response = await client.chat.completions.create({
    model: MODEL,
    max_tokens: 2000,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
  });

  return {
    text: response.choices[0]?.message?.content ?? "",
    usage: response.usage,
  };
}
