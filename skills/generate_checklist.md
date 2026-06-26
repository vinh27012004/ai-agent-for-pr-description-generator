# Skill: generate_checklist

## Purpose
Tạo pre-merge checklist thông minh, relevant với loại thay đổi — không phải checklist generic cho mọi PR.

## Input
Kết quả từ skill `analyze_diff`:
- `change_type`
- `has_db_migration`
- `has_api_change`
- `has_breaking_change`
- `has_env_change`
- `test_files_included`
- `affected_areas`

## Output
Markdown checklist section.

## Checklist Rules

### Base checklist (luôn có)
```markdown
## ✅ Pre-merge Checklist
- [ ] Code self-reviewed
- [ ] No debug logs / commented-out code left
- [ ] PR title follows conventional commits format
```

### Thêm nếu `test_files_included = false`
```markdown
- [ ] ⚠️ No tests included — explain why in PR description or add tests
```

### Thêm nếu `has_db_migration = true`
```markdown
- [ ] Migration is backward-compatible (old app can run against new schema)
- [ ] Migration tested on a copy of production data (or staging)
- [ ] Rollback plan documented
```

### Thêm nếu `has_api_change = true`
```markdown
- [ ] API contract updated in docs/Swagger/Postman collection
- [ ] Existing consumers of this endpoint notified (if applicable)
- [ ] Response shape validated against frontend/mobile expectations
```

### Thêm nếu `has_breaking_change = true`
```markdown
- [ ] 🚨 BREAKING CHANGE: Version bump required
- [ ] Migration guide written for dependent services
- [ ] Deprecation notice added to old behavior
```

### Thêm nếu `has_env_change = true`
```markdown
- [ ] New env vars added to `.env.example`
- [ ] DevOps/infra team notified of new environment variables
- [ ] Default values are safe for existing deployments
```

### Thêm nếu `change_type = feat`
```markdown
- [ ] Feature flag considered (for gradual rollout)
- [ ] Analytics/logging added if needed
```

### Thêm nếu `affected_areas` chứa "auth" hoặc "security"
```markdown
- [ ] Security review requested / self-reviewed
- [ ] No sensitive data logged or exposed in responses
```

## Notes
- Đừng thêm checklist items không relevant — checklist dài sẽ bị ignored
- Items phải actionable, không phải reminder chung chung
