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

# Cấu hình env (copy mẫu rồi điền key thật vào .env — .env đã được gitignore)
cp .env.example .env
```

### Chế độ CLI

```bash
# Dùng với git diff thật
node scripts/generate-pr.js \
  --diff "$(git diff HEAD~1)" \
  --why "Security improvement for token theft prevention"

# Với commit messages
node scripts/generate-pr.js \
  --commits "feat: add JWT refresh token rotation" \
  --why "Ticket SEC-421"
```

### Chế độ Webhook server (tự động trên PR)

```bash
# Chạy server (mặc định cổng 3000)
npm run server
```

- Trỏ GitHub webhook tới `POST /webhook`, content type `application/json`,
  secret khớp với `GITHUB_WEBHOOK_SECRET`, sự kiện **Pull requests**.
- Server verify chữ ký `X-Hub-Signature-256` (HMAC SHA-256), chỉ xử lý PR
  `opened`/`reopened`.
- PR chưa có mô tả → ghi thẳng vào body; PR đã có mô tả → post comment (không ghi đè).
- Healthcheck: `GET /health`.

## Output mẫu

```markdown
## 📋 What Changed
- Added `generateTokenPair()` to issue access + refresh token together
- Implemented `rotateRefreshToken()` with automatic reuse detection
- New POST `/auth/refresh` and `/auth/logout` endpoints
- Refresh tokens stored hashed in Redis with 7-day TTL

## 💡 Why
Implements refresh token rotation to prevent token theft attacks.
When a stolen token is reused, all sessions for that user are invalidated.

## 🧪 How to Test
1. `POST /auth/login` → receive `{ accessToken, refreshToken }`
2. `POST /auth/refresh` with `{ userId, refreshToken }` → receive new pair
3. Use the OLD refreshToken again → expect 401 Unauthorized
4. Verify old session is fully invalidated

## ✅ Pre-merge Checklist
- [ ] Code self-reviewed
- [ ] No debug logs / commented-out code left
- [ ] PR title follows conventional commits format
- [ ] Security review requested / self-reviewed
- [ ] No sensitive data logged or exposed in responses
- [ ] API contract updated in docs/Swagger/Postman collection
```

## Điểm demo

- **prompt-as-config**: Thay đổi hành vi agent bằng cách edit `.md` file, không cần sửa code
- **Skill composability**: Mỗi skill độc lập, có thể reuse ở agent khác
- **Smart checklist**: Chỉ thêm checklist items relevant (auth → security items, API change → docs items)
- **Zero hallucination constraint**: Agent không được bịa context không có trong diff
