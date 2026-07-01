# Skill: generate_pr_description

## Purpose
Tạo nội dung chính của PR description từ kết quả phân tích diff.

## Input
- Kết quả từ skill `analyze_diff` (JSON)
- `additional_context`: (optional) Thêm context từ user về "Why"

## Output
Markdown PR description theo template dưới đây.

## Template

```markdown
## 📋 What Changed
<!-- Súc tích, kỹ thuật, tối đa 5 bullets -->
- {key_change_1}
- {key_change_2}
- ...

## 💡 Why
<!-- Lý do business/technical, có thể là link ticket -->
{motivation — nếu không rõ, ghi "Xem issue liên quan #___"}

## 🧪 How to Test
<!-- Step-by-step, reproducible -->
1. {setup_step nếu cần}
2. {action}
3. {expected result}

**Các test case cần kiểm tra:**
- [ ] {happy path}
- [ ] {edge case 1}
- [ ] {edge case 2 nếu relevant}

## ⚠️ Notes for Reviewers
<!-- Chỉ thêm nếu có điều đặc biệt cần chú ý -->
{notes hoặc bỏ section này nếu không cần}
```

## Instructions
- **What Changed**: Dùng kết quả `key_changes` từ analyze_diff, viết bằng tiếng Việt mô tả thay đổi đã thực hiện ("Đã thêm...", "Đã sửa...", "Đã refactor...")
- **Why**: Nếu có `additional_context` từ user thì dùng. Nếu không có, suy luận từ `change_type` (feat → new capability, fix → bug description, v.v.)
- **How to Test**: Tạo steps cụ thể dựa trên `affected_areas`. Nếu có API change → curl example. Nếu có UI change → browser steps
- **Notes**: Chỉ thêm nếu có `has_breaking_change = true` hoặc `has_db_migration = true`
- **Với diff nhỏ/đơn giản**: rút gọn tối đa. What Changed chỉ 1–2 bullets, Why 1 câu (hoặc suy từ `change_type`), How to Test chỉ giữ bước cốt lõi và bỏ các edge-case test không liên quan, bỏ hẳn section Notes. Đừng điền cho đủ template.

## Tone & Style
- Kỹ thuật nhưng dễ đọc
- Không viết quá dài — reviewer cần đọc nhanh
- Dùng emoji headers để scannable (tuỳ team culture, có thể bỏ)
