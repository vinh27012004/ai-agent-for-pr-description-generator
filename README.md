# 🤖 PR Description Generator Agent

Demo kiến trúc **Orchestrator-Worker / prompt-as-config** — mỗi Agent và Skill là một file `.md`.

## Cấu trúc dự án

```
pr-agent/
├── agents/
│   └── pr-description-agent.md     ← Agent definition (role, goal, workflow)
├── skills/
│   ├── analyze_diff.md              ← Skill: phân tích git diff
│   ├── generate_pr_description.md  ← Skill: tạo nội dung PR
│   └── generate_checklist.md       ← Skill: tạo pre-merge checklist
├── scripts/
│   └── generate-pr.js              ← CLI runner (Orchestrator)
└── package.json
```

## Kiến trúc

```
User Input (git diff / commits)
        ↓
  [Orchestrator — generate-pr.js]
        ↓
  Loads Agent + Skills as system prompt (prompt-as-config)
        ↓
  Calls Claude API (claude-sonnet-4-6)
        ↓
  Claude follows workflow:
    1. analyze_diff skill
    2. generate_pr_description skill  
    3. generate_checklist skill
        ↓
  Output: PR Description Markdown
```

## Cách dùng

```bash
# Install
npm install

# Demo với diff có sẵn
npm run demo

# Dùng với git diff thật
node scripts/generate-pr.js \
  --diff "$(git diff HEAD~1)" \
  --why "Security improvement for token theft prevention"

# Với commit messages
node scripts/generate-pr.js \
  --commits "feat: add JWT refresh token rotation" \
  --why "Ticket SEC-421"
```

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
