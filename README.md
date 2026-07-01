# 🤖 PR Description Generator Agent

Demo kiến trúc **Orchestrator-Worker / prompt-as-config** — mỗi Agent và Skill là một file `.md`.

## Cấu trúc dự án

```
pr-agent/
├── agents/
│   └── pr-description-agent.md      ← Agent definition (role, goal, workflow)
├── skills/
│   ├── analyze_diff.md              ← Skill: phân tích git diff
│   ├── generate_pr_description.md   ← Skill: tạo nội dung PR
│   └── generate_checklist.md        ← Skill: tạo pre-merge checklist
├── src/
│   ├── llm.js                       ← Model layer: load agent+skills, gọi LLM qua 9router
│   ├── github.js                    ← GitHub REST helpers (lấy diff, update body, comment)
│   └── server.js                    ← Express webhook server cho event pull_request
├── scripts/
│   └── generate-pr.js               ← CLI runner (Orchestrator)
├── .env.example                     ← Mẫu biến môi trường
└── package.json
```

## Kiến trúc

Model layer gọi LLM qua **9router** (endpoint OpenAI-compatible), cấu hình hoàn toàn
bằng biến môi trường (`LLM_BASE_URL`, `LLM_API_KEY`, `LLM_MODEL`) nên không hardcode
endpoint/key. Có 2 cách chạy: **CLI** (thủ công) và **Webhook server** (tự động trên PR).

```
                  ┌──────────────────────────────────────────┐
  CLI:            │  scripts/generate-pr.js  (--diff/--commits)│
                  └──────────────────┬───────────────────────┘
                                     │
  Webhook:  GitHub PR event ─→ src/server.js (verify HMAC) ─┐
                                     │                       │
                                     ▼                       ▼
                          src/llm.js: load Agent + 3 Skills as system prompt
                                     │            (prompt-as-config)
                                     ▼
                       Gọi LLM qua 9router (OpenAI-compatible)
                                     │
                       LLM follows workflow trong agent:
                         1. analyze_diff
                         2. generate_pr_description
                         3. generate_checklist
                                     │
                                     ▼
                          Output: PR Description (Markdown)
                                     │
              CLI → in ra stdout  •  Webhook → update PR body / post comment
```

## Cách dùng

```bash
# Install
npm install
