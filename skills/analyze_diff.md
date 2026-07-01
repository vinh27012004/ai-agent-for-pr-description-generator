# Skill: analyze_diff

## Purpose
Phân tích git diff hoặc commit messages để extract các thông tin cấu trúc cần thiết cho việc tạo PR description.

## Input
- `diff_text`: Raw output của `git diff` hoặc `git diff HEAD~N HEAD`
- `commit_messages`: (optional) Danh sách commit messages

## Output (JSON structure)
```json
{
  "change_type": "feat | fix | refactor | chore | docs | test | perf",
  "affected_areas": ["auth", "database", "api", "ui", "config", ...],
  "files_changed": ["src/auth/jwt.ts", ...],
  "summary": "Tóm tắt kỹ thuật một dòng",
  "key_changes": [
    "Đã thêm logic xoay vòng refresh token trong JwtService",
    "Thêm cột DB mới: users.refresh_token_hash"
  ],
  "has_breaking_change": false,
  "has_db_migration": true,
  "has_api_change": false,
  "has_env_change": false,
  "test_files_included": true
}
```

## Instructions
Khi phân tích diff, hãy:
1. Xác định `change_type` từ prefix của commit message (feat/fix/refactor...) hoặc từ nội dung
2. List các `affected_areas` dựa trên folder structure và file names
3. Tóm tắt `key_changes` — mỗi item là 1 thay đổi cụ thể, actionable
4. Detect các flag đặc biệt:
   - `has_db_migration`: có file migration hoặc schema change
   - `has_api_change`: có thay đổi route, controller, endpoint
   - `has_env_change`: có thêm/sửa biến môi trường
   - `has_breaking_change`: thay đổi làm hỏng backward compatibility
   - `test_files_included`: có file test đi kèm không

## Notes
- Nếu diff quá lớn (>500 lines), tập trung vào structural changes, bỏ qua formatting-only changes
- Rename/move file không phải breaking change trừ khi là public API
- "Breaking" **không phải** một `change_type` — nó trực giao với type (một `feat` vẫn có thể breaking). Luôn giữ `change_type` là loại thật (feat/fix/…) và đánh dấu riêng qua cờ `has_breaking_change`
