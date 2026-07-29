# Module 3 — Hoàng Hải Dương

| | |
|---|---|
| Họ và tên | Hoàng Hải Dương |
| Mã học viên | 2A202601337 |
| Vai trò | Tầng LLM, kiểm duyệt & minh bạch tool |

Client gọi Groq (timeout, retry, JSON mode), thẻ cảnh báo yêu cầu bất hợp lý, popup tính năng khoá, box raw JSON của mọi tool.

## File phụ trách

- `src/lib/groqClient.js`
- `src/components/chatbot/ToolUsageBox.jsx`
- `src/components/chatbot/AdvisoryCard.jsx`
- `src/components/chatbot/PaywallModal.jsx`

## Phụ thuộc

Dùng ui primitive của module 1.

## Merge

Thư mục này sắp xếp y hệt cấu trúc dự án chính. Khi merge, copy toàn bộ nội dung
của nó vào thư mục gốc `travel-planner/`. Không file nào trùng với module khác
nên hợp nhất 6 module sẽ ra đúng dự án hoàn chỉnh, không có conflict.
