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
# Module 6 — Phạm Đức Hiệp

| | |
|---|---|
| Họ và tên | Phạm Đức Hiệp |
| Mã học viên | 2A202601329 |
| Vai trò | Vận tải, lịch trình & tài liệu |

Bảng giá xe rule-based, bảng lịch trình 7 ngày, và tài liệu dự án.

## File phụ trách

- `src/components/chatbot/TransportCard.jsx`
- `src/components/chatbot/ScheduleTable.jsx`
- `README.md`

## Phụ thuộc

Dùng travelApi của module 4 và ui primitive của module 1.

## Merge

Thư mục này sắp xếp y hệt cấu trúc dự án chính. Khi merge, copy toàn bộ nội dung
của nó vào thư mục gốc `travel-planner/`. Không file nào trùng với module khác
nên hợp nhất 6 module sẽ ra đúng dự án hoàn chỉnh, không có conflict.
