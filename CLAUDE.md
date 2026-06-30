# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

An AI agent that generates Pull Request descriptions from a git diff and/or commit
messages. It calls an LLM through **9router** (an OpenAI-compatible endpoint) and runs
two ways: a CLI (manual) and an Express webhook server (automatic on GitHub PR events).

ES modules throughout (`"type": "module"`). Node's built-in `fetch` is used for GitHub
calls — no HTTP client dependency.

## Commands

```bash
npm install          # install deps
npm run generate     # CLI: node scripts/generate-pr.js  (pass --diff / --commits / --why)
npm run server       # start the webhook server (default :3000)
```

There is no build step, no linter, and no test suite. `npm run generate` with a real
`--diff` is the fastest way to exercise the full prompt pipeline end-to-end.

CLI usage:
```bash
node scripts/generate-pr.js --diff "$(git diff HEAD~1)" --why "Ticket SEC-421"
node scripts/generate-pr.js --commits "feat: add X"
```

## Required environment

Copy `.env.example` to `.env` (gitignored) and fill in real values. **All three LLM vars
are mandatory and have no defaults** — there is no validation, so a missing/wrong value
surfaces only as an error from the OpenAI client at call time:

- `LLM_BASE_URL`, `LLM_API_KEY`, `LLM_MODEL` — the 9router (OpenAI-compatible) connection
- `GITHUB_TOKEN` — needs Pull requests: Read & write (server mode only)
- `GITHUB_WEBHOOK_SECRET` — must match the GitHub webhook config (server mode only)
- `PORT` — defaults to 3000

## Architecture: prompt-as-config

This is the core idea and the most important thing to understand before changing anything.

**The "agent" and "skills" are Markdown files, not executable code.** They live in
`agents/pr-description-agent.md` and `skills/*.md`. At runtime, `src/llm.js`
(`loadPromptConfig` + `buildSystemPrompt`) reads those files and concatenates them into a
single system prompt. There is **no tool-calling, no multi-step orchestration in code, and
no per-skill function** — the entire job is one `chat.completions.create` call. The
"workflow" (analyze_diff → generate_pr_description → generate_checklist) is instructions
the model follows inside that one call, not code paths.

Consequences:
- To change agent behavior, **edit the `.md` files** — usually no JS change is needed.
- The skill `.md` files are **not auto-discovered**. Each one is hardcoded by path in
  `loadPromptConfig()` and slotted into the prompt by `buildSystemPrompt()`. Adding a new
  skill means editing both of those functions in `src/llm.js`, not just dropping a file in
  `skills/`.
- Much of the prompt content (agent role, constraints, skill bodies) is written in
  Vietnamese. The model is instructed to produce the PR description body in Vietnamese
  while keeping the section headers (## What Changed, ## Why, ## How to Test,
  ## Pre-merge Checklist, ## Notes for Reviewers) in English.

### Flow

```
CLI (scripts/generate-pr.js)  ─┐
                               ├─→ src/llm.js generateDescription({diff, commits, why})
GitHub PR webhook (server.js) ─┘        └─ builds system prompt from .md files, one LLM call
                                                              │
CLI → prints to stdout                                        ▼
Webhook → updatePullRequestBody OR postIssueComment (src/github.js)
```

### Webhook server specifics (`src/server.js`)

- Verifies `X-Hub-Signature-256` (HMAC-SHA256) using the **raw** request body, which is
  captured via an `express.json({ verify })` hook into `req.rawBody`. Don't switch the
  body parser in a way that loses the raw buffer or signature verification breaks.
- Only handles `pull_request` events with action `opened` or `reopened` (this avoids an
  infinite loop where the bot editing the PR body re-triggers itself).
- Responds `202` immediately, then does the LLM call + GitHub write in the background to
  stay under GitHub's ~10s webhook timeout.
- **Does not overwrite user content**: if the PR body is empty it sets the body; if the PR
  already has a description it posts a comment instead.
