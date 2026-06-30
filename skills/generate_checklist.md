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
- [ ] Đã tự review code
- [ ] Không còn debug log / code bị comment lại
- [ ] Tiêu đề PR theo đúng format conventional commits
```

### Thêm nếu `test_files_included = false`
```markdown
- [ ] ⚠️ Chưa có test — giải thích lý do trong PR description hoặc bổ sung test
```

### Thêm nếu `has_db_migration = true`
```markdown
- [ ] Migration tương thích ngược (app cũ vẫn chạy được với schema mới)
- [ ] Đã test migration trên bản sao dữ liệu production (hoặc staging)
- [ ] Đã ghi lại kế hoạch rollback
```

### Thêm nếu `has_api_change = true`
```markdown
- [ ] Đã cập nhật API contract trong docs/Swagger/Postman collection
- [ ] Đã thông báo cho các consumer đang dùng endpoint này (nếu có)
- [ ] Đã kiểm tra response khớp với mong đợi của frontend/mobile
```

### Thêm nếu `has_breaking_change = true`
```markdown
- [ ] 🚨 BREAKING CHANGE: Cần tăng version
- [ ] Đã viết hướng dẫn migration cho các service phụ thuộc
- [ ] Đã thêm thông báo deprecation cho hành vi cũ
```

### Thêm nếu `has_env_change = true`
```markdown
- [ ] Đã thêm biến env mới vào `.env.example`
- [ ] Đã thông báo cho team DevOps/infra về các biến môi trường mới
- [ ] Giá trị mặc định an toàn cho các deployment hiện tại
```

### Thêm nếu `change_type = feat`
```markdown
- [ ] Đã cân nhắc dùng feature flag (để rollout từ từ)
- [ ] Đã thêm analytics/logging nếu cần
```

### Thêm nếu `affected_areas` chứa "auth" hoặc "security"
```markdown
- [ ] Đã yêu cầu security review / tự review bảo mật
- [ ] Không log hoặc lộ dữ liệu nhạy cảm trong response
```

## Notes
- Đừng thêm checklist items không relevant — checklist dài sẽ bị ignored
- Items phải actionable, không phải reminder chung chung
