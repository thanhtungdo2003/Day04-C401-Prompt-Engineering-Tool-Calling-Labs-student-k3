# AI Travel Planner

Web app một trang, tạo lịch trình du lịch 7 ngày. Người dùng chọn điểm xuất phát, điểm đến,
ngân sách, mục tiêu. App gọi lần lượt 6 hàm API rồi dùng LLM tổng hợp thành lịch trình đầy đủ.

## Chạy

```bash
npm install
cp .env.example .env      # điền VITE_GROQ_API_KEY
npm run dev               # http://localhost:5173
```

Build production: `npm run build` rồi `npm run preview`.

## Data flow

```
getWeather → checkRequest → ┌ getTripPlan ─────────┐
                            │ getPlaces            │→ generateSchedule
                            │ getHotels            │
                            └ getTransportPricing ─┘
```

Bốn bước giữa độc lập với nhau nên chạy song song. Mỗi kết quả hiển thị dần trong thẻ riêng;
`ToolUsageBox` gom raw JSON của tất cả bước ở cuối trang (mặc định thu gọn).

`checkRequest` là cổng chặn sớm: nếu yêu cầu bất hợp lý thì dừng luôn, không tốn thời gian
cho các bước nặng phía sau.

### Chống chậm

| Vấn đề | Cách xử lý |
|---|---|
| Geocode bị gọi 5 lần, 4 lần trùng điểm đến | Cache theo tên trong `geocode()` — còn 2 request |
| Pipeline nối đuôi dù các bước độc lập | 4 bước giữa chạy `Promise.all` |
| Groq treo vô hạn khi mạng lỗi | `AbortController` 40s + retry 2 lần cho lỗi 408/429/5xx |
| POI phải tải lại mỗi lần đổi ngân sách | Cache `sessionStorage` theo toạ độ |

### Kiểm tra tính hợp lý

`checkRequest` trả `verdict`:

- `block` — mục tiêu không thể thực hiện ở điểm đến, hoặc ngân sách dưới sàn. Dừng pipeline,
  hiện `AdvisoryCard` với lý do và gợi ý đổi mục tiêu hoặc đổi điểm đến.
- `warn` — làm được nhưng có rủi ro. Vẫn chạy tiếp, chỉ hiện cảnh báo.
- `ok` — không hiện gì.

Sàn ngân sách tính bằng quy tắc cứng trong code, không phụ thuộc phán đoán của LLM:
`đi lại khứ hồi theo khoảng cách + 7 đêm × 300.000 + 7 ngày ăn × 200.000`. Ví dụ Hà Nội →
Đà Nẵng (606 km) cần tối thiểu 6.700.000 VND.

### Gợi ý lại

Khi đã có kết quả mà người dùng sửa lại form, nút **Gợi ý lại** xuất hiện. Tính năng tinh
chỉnh dựa trên kết quả cũ **chưa được xây dựng** — bấm vào chỉ mở `PaywallModal` báo cần trả
phí. Popup không thu thập thông tin thanh toán, chỉ là placeholder. Nút *Lên lịch 7 ngày* vẫn
chạy bình thường và tạo lịch mới từ đầu.

## Cấu trúc

| Path | Vai trò |
|---|---|
| `src/App.jsx` | Router, auth wrapper |
| `src/pages/Home.jsx` | Điều phối API call, hiển thị kết quả |
| `src/lib/groqClient.js` | Gọi Groq chat completions, JSON mode |
| `src/lib/travelApi.js` | 6 hàm API + geocoding + bảng giá xe rule-based |
| `src/lib/osmApi.js` | POI thật từ OpenStreetMap (Photon + Overpass), cache + retry |
| `src/components/chatbot/` | 12 component: input, trace, advisory, 5 thẻ kết quả, bảng lịch, tool box, map modal, paywall |
| `src/components/ui/` | Primitive kiểu shadcn/ui |

## Bản đồ

`MapModal.jsx` gắn nút icon bản đồ vào mỗi địa điểm, chỗ ở, điểm đến và tuyến đi. Bấm nút
mở modal nhúng iframe Google Maps; trong modal có nút mở Google Maps ở tab mới. Dùng
`output=embed` nên không cần API key.

Khách sạn và nhà hàng ghim theo **toạ độ OSM** (`q=lat,lon`, zoom 17) nên đúng vị trí,
không phụ thuộc việc Google có tìm ra tên hay không. Địa danh tham quan không có toạ độ thì
mới tìm theo tên.

## Theme

Light theme, nền phẳng, không gradient. Màu chủ đạo cam đỏ + đen, khai báo bằng CSS
variable trong `src/index.css` và map sang Tailwind token trong `tailwind.config.js`.

## Nguồn dữ liệu

| Dữ liệu | Nguồn | Thật hay ước lượng |
|---|---|---|
| Thời tiết 7 ngày | Open-Meteo | Thật |
| Toạ độ, khoảng cách | Open-Meteo geocoding | Thật |
| Khách sạn, nhà hàng | OpenStreetMap (Photon → Overpass) | Tên, địa chỉ, toạ độ đều thật |
| Giá phòng, giá ăn | Groq | **Ước lượng**, hiển thị với dấu `~` |
| Địa danh tham quan, hoạt động | Groq | Landmark nổi tiếng |
| Kế hoạch đi lại, lịch trình | Groq | Tổng hợp từ dữ liệu trên |
| Bảng giá xe | Rule-based trong code | Cố định |

Khách sạn và nhà hàng **không** do LLM sinh ra. LLM bịa tên và địa chỉ không tồn tại, nên
`osmApi.js` lấy POI thật từ dữ liệu OpenStreetMap, còn LLM chỉ được chú thích giá và mô tả
cho đúng danh sách đó — prompt cấm thêm, bớt, đổi tên hay đổi thứ tự.

Hai nguồn OSM, đều miễn phí và hỗ trợ CORS:

- **Photon** (`photon.komoot.io`) — nguồn chính. Xếp hạng theo độ nổi bật nên ra đúng các cơ
  sở lớn, phản hồi ~0,3–1s, không rate-limit gắt. Không có tag `stars`/`cuisine`.
- **Overpass** — dự phòng. Tag đầy đủ hơn nhưng là dịch vụ cộng đồng, rất hay trả 429/504.
  Chỉ gọi khi Photon trả dưới 4 kết quả, và gộp khách sạn + nhà hàng vào một query duy nhất.

Kết quả cache theo toạ độ trong `sessionStorage`, nên đổi ngân sách hay chạy lại cùng một
thành phố không tốn thêm request.

Rating khách sạn chỉ hiện khi OSM có tag `stars` thật — không có thì để trống thay vì bịa.

## Bảng giá xe

| Loại | Cơ bản | Mỗi km |
|---|---:|---:|
| Grab Bike | 10.000 | 12.000 |
| Grab Car 4 chỗ | 20.000 | 15.000 |
| Grab Car 7 chỗ | 25.000 | 18.000 |
| GreenSM Bike | 10.000 | 13.000 |
| GreenSM Car 4 chỗ | 20.000 | 16.000 |
| GreenSM Car 7 chỗ | 25.000 | 19.000 |
| Taxi | 15.000 | 14.000 |
| Bus | 7.000/chuyến | — |

## Gợi ý phương tiện theo khoảng cách

Dưới 50km xe máy · 50–300km ô tô/xe khách · 300–1000km tàu hỏa/xe khách đường dài ·
trên 1000km máy bay. Khoảng cách tính bằng haversine từ toạ độ geocoding.

## Bảo mật

API key Groq nằm trong bundle frontend — chỉ dùng cho demo/lab. Production phải proxy qua
backend. Không commit `.env`.
