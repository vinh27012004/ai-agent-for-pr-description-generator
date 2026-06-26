// src/github.js — GitHub REST API helpers (token-based)

const API = "https://api.github.com";

function headers(accept = "application/vnd.github+json") {
  return {
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    Accept: accept,
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "pr-description-agent",
  };
}

// Lấy diff dạng text của 1 PR (Accept: ...diff trả thẳng unified diff)
export async function getPullRequestDiff(owner, repo, number) {
  const res = await fetch(`${API}/repos/${owner}/${repo}/pulls/${number}`, {
    headers: headers("application/vnd.github.diff"),
  });
  if (!res.ok) throw new Error(`getPullRequestDiff ${res.status}: ${await res.text()}`);
  return res.text();
}

// Lấy metadata PR (title, body, commits...) nếu cần
export async function getPullRequest(owner, repo, number) {
  const res = await fetch(`${API}/repos/${owner}/${repo}/pulls/${number}`, {
    headers: headers(),
  });
  if (!res.ok) throw new Error(`getPullRequest ${res.status}: ${await res.text()}`);
  return res.json();
}

// Cập nhật body của PR (ghi đè mô tả)
export async function updatePullRequestBody(owner, repo, number, body) {
  const res = await fetch(`${API}/repos/${owner}/${repo}/pulls/${number}`, {
    method: "PATCH",
    headers: headers(),
    body: JSON.stringify({ body }),
  });
  if (!res.ok) throw new Error(`updatePullRequestBody ${res.status}: ${await res.text()}`);
  return res.json();
}

// Hoặc: post một comment thay vì ghi đè body (an toàn hơn khi PR đã có mô tả)
export async function postIssueComment(owner, repo, number, body) {
  const res = await fetch(`${API}/repos/${owner}/${repo}/issues/${number}/comments`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ body }),
  });
  if (!res.ok) throw new Error(`postIssueComment ${res.status}: ${await res.text()}`);
  return res.json();
}
