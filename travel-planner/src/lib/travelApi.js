import { chatJson } from './groqClient.js'
import { searchRestaurants, searchStays } from './osmApi.js'

/* ------------------------------------------------------------------ */
/* Open-Meteo: geocoding + du bao 7 ngay (mien phi, khong can key)      */
/* ------------------------------------------------------------------ */

const GEOCODE_URL = 'https://geocoding-api.open-meteo.com/v1/search'
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast'

// WMO weather code -> nhan + icon key (icon key map sang lucide o WeatherCard)
const WEATHER_CODES = {
  0: { label: 'Trời quang', icon: 'sun' },
  1: { label: 'Ít mây', icon: 'sun' },
  2: { label: 'Có mây', icon: 'cloud-sun' },
  3: { label: 'Nhiều mây', icon: 'cloud' },
  45: { label: 'Sương mù', icon: 'fog' },
  48: { label: 'Sương muối', icon: 'fog' },
  51: { label: 'Mưa phùn', icon: 'drizzle' },
  53: { label: 'Mưa phùn', icon: 'drizzle' },
  55: { label: 'Mưa phùn', icon: 'drizzle' },
  61: { label: 'Mưa nhẹ', icon: 'rain' },
  63: { label: 'Mưa', icon: 'rain' },
  65: { label: 'Mưa to', icon: 'rain' },
  71: { label: 'Tuyết', icon: 'snow' },
  73: { label: 'Tuyết', icon: 'snow' },
  75: { label: 'Tuyết dày', icon: 'snow' },
  80: { label: 'Mưa rào', icon: 'rain' },
  81: { label: 'Mưa rào', icon: 'rain' },
  82: { label: 'Mưa rất to', icon: 'rain' },
  95: { label: 'Dông', icon: 'storm' },
  96: { label: 'Dông kèm mưa đá', icon: 'storm' },
  99: { label: 'Dông mạnh', icon: 'storm' },
}

export function describeWeatherCode(code) {
  return WEATHER_CODES[code] ?? { label: 'Không rõ', icon: 'cloud' }
}

export class UnknownPlaceError extends Error {
  constructor(location) {
    super(`Không tìm thấy địa điểm "${location}"`)
    this.name = 'UnknownPlaceError'
    this.location = location
  }
}

// Mot lan lap lich goi geocode toi 5 lan, phan lon la trung diem den.
// Cache lai de khong ton them round-trip.
const geocodeCache = new Map()

async function geocodeUncached(location) {
  const url = `${GEOCODE_URL}?name=${encodeURIComponent(location)}&count=1&language=vi&format=json`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Geocoding lỗi ${res.status}`)
  const data = await res.json()
  const hit = data.results?.[0]
  if (!hit) throw new UnknownPlaceError(location)
  return {
    name: hit.name,
    country: hit.country ?? '',
    admin: hit.admin1 ?? '',
    latitude: hit.latitude,
    longitude: hit.longitude,
  }
}

export function geocode(location) {
  const key = location.trim().toLowerCase()
  if (!geocodeCache.has(key)) {
    geocodeCache.set(
      key,
      geocodeUncached(location).catch((err) => {
        geocodeCache.delete(key)
        throw err
      }),
    )
  }
  return geocodeCache.get(key)
}

function haversineKm(a, b) {
  const R = 6371
  const toRad = (deg) => (deg * Math.PI) / 180
  const dLat = toRad(b.latitude - a.latitude)
  const dLon = toRad(b.longitude - a.longitude)
  const lat1 = toRad(a.latitude)
  const lat2 = toRad(b.latitude)
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2)
  return Math.round(2 * R * Math.asin(Math.sqrt(h)))
}

/**
 * Du bao 7 ngay cho mot dia diem.
 */
export async function getWeather(location) {
  const place = await geocode(location)
  const params = new URLSearchParams({
    latitude: String(place.latitude),
    longitude: String(place.longitude),
    daily: 'temperature_2m_max,temperature_2m_min,weathercode,precipitation_probability_max',
    hourly: 'relative_humidity_2m',
    timezone: 'auto',
    forecast_days: '7',
  })

  const res = await fetch(`${FORECAST_URL}?${params}`)
  if (!res.ok) throw new Error(`Open-Meteo lỗi ${res.status}`)
  const data = await res.json()

  const humidityByDay = []
  for (let day = 0; day < 7; day += 1) {
    const slice = (data.hourly?.relative_humidity_2m ?? []).slice(day * 24, day * 24 + 24)
    const avg = slice.length
      ? Math.round(slice.reduce((sum, v) => sum + v, 0) / slice.length)
      : null
    humidityByDay.push(avg)
  }

  const days = (data.daily?.time ?? []).map((date, i) => ({
    date,
    tempMax: Math.round(data.daily.temperature_2m_max[i]),
    tempMin: Math.round(data.daily.temperature_2m_min[i]),
    code: data.daily.weathercode[i],
    rainChance: data.daily.precipitation_probability_max?.[i] ?? null,
    humidity: humidityByDay[i],
    ...describeWeatherCode(data.daily.weathercode[i]),
  }))

  return { place, days }
}

/* ------------------------------------------------------------------ */
/* Bang gia xe rule-based (khong can API call)                          */
/* ------------------------------------------------------------------ */

const TRANSPORT_RULES = [
  { id: 'grab_bike', brand: 'Grab', name: 'Grab Bike', vehicle: 'bike', base: 10000, perKm: 12000 },
  { id: 'grab_car_4', brand: 'Grab', name: 'Grab Car 4 chỗ', vehicle: 'car4', base: 20000, perKm: 15000 },
  { id: 'grab_car_7', brand: 'Grab', name: 'Grab Car 7 chỗ', vehicle: 'car7', base: 25000, perKm: 18000 },
  { id: 'greensm_bike', brand: 'GreenSM', name: 'GreenSM Bike', vehicle: 'bike', base: 10000, perKm: 13000 },
  { id: 'greensm_car_4', brand: 'GreenSM', name: 'GreenSM Car 4 chỗ', vehicle: 'car4', base: 20000, perKm: 16000 },
  { id: 'greensm_car_7', brand: 'GreenSM', name: 'GreenSM Car 7 chỗ', vehicle: 'car7', base: 25000, perKm: 19000 },
  { id: 'taxi', brand: 'Taxi', name: 'Taxi', vehicle: 'car4', base: 15000, perKm: 14000 },
  { id: 'bus', brand: 'Bus', name: 'Xe buýt', vehicle: 'bus', base: 7000, perKm: 0, flat: true },
]

export function getTransportPricing() {
  return TRANSPORT_RULES.map((rule) => ({
    ...rule,
    sample5km: computeCost(rule, 5),
    sample10km: computeCost(rule, 10),
  }))
}

function computeCost(rule, distanceKm) {
  if (rule.flat) return rule.base
  return rule.base + rule.perKm * Math.max(0, distanceKm)
}

/**
 * Tinh gia rule-based cho mot loai xe.
 * @param {number} distanceKm
 * @param {string} vehicleType id trong bang gia, vd 'grab_bike'
 */
export function calculateTransportCost(distanceKm, vehicleType) {
  const rule = TRANSPORT_RULES.find((r) => r.id === vehicleType)
  if (!rule) throw new Error(`Không có loại xe: ${vehicleType}`)
  return { ...rule, distanceKm, cost: computeCost(rule, distanceKm) }
}

/* ------------------------------------------------------------------ */
/* LLM-backed: trip plan, places, hotels, schedule                      */
/* ------------------------------------------------------------------ */

const SYSTEM = 'Bạn là chuyên gia lữ hành Việt Nam. Trả lời bằng tiếng Việt, ngắn gọn, giá theo VND.'

function distanceRule(distanceKm) {
  if (distanceKm < 50) return 'dưới 50km: đi xe máy'
  if (distanceKm < 300) return '50-300km: ô tô hoặc xe khách'
  if (distanceKm < 1000) return '300-1000km: tàu hỏa hoặc xe khách đường dài'
  return 'trên 1000km: máy bay, không nên ô tô/xe máy'
}

function weatherDigest(weather) {
  if (!weather?.days?.length) return 'không có dữ liệu'
  return weather.days
    .map((d) => `${d.date}: ${d.label}, ${d.tempMin}-${d.tempMax}°C`)
    .join('; ')
}

/** Toa do hai dau + khoang cach. Geocode da cache nen goi lai khong ton them. */
export async function getRoute(departure, destination) {
  const [from, to] = await Promise.all([geocode(departure), geocode(destination)])
  return { from, to, distanceKm: haversineKm(from, to) }
}

/* Chi phi di lai mot chieu uoc luong theo khoang cach, dung lam san ngan sach. */
function oneWayFloor(distanceKm) {
  if (distanceKm < 50) return 100_000
  if (distanceKm < 300) return 600_000
  if (distanceKm < 1000) return 1_600_000
  return 4_000_000
}

const NIGHTLY_FLOOR = 300_000
const DAILY_FOOD_FLOOR = 200_000

/** San ngan sach toi thieu cho 7 ngay: di lai khu hoi + 7 dem + 7 ngay an. */
export function budgetFloor(distanceKm) {
  return oneWayFloor(distanceKm) * 2 + 7 * NIGHTLY_FLOOR + 7 * DAILY_FOOD_FLOOR
}

/**
 * Kiem tra yeu cau co kha thi khong truoc khi ton thoi gian cho cac buoc nang.
 * Tra ve verdict: ok | warn | block, kem ly do va goi y thay doi.
 */
export async function checkRequest({ departure, destination, budget, objective, weather }) {
  const { from, to, distanceKm } = await getRoute(departure, destination)
  const floor = budgetFloor(distanceKm)

  const data = await chatJson({
    system: SYSTEM,
    maxTokens: 1200,
    user: `Đánh giá xem yêu cầu du lịch sau có hợp lý không.

Đi từ ${from.name} (${from.country}) đến ${to.name} (${to.country}).
Khoảng cách: ${distanceKm} km. Ngân sách: ${budget} VND cho 7 ngày.
Mục tiêu người dùng nêu: ${objective || 'không nêu'}.
Thời tiết 7 ngày tại điểm đến: ${weatherDigest(weather)}.

Trả verdict:
- "block" nếu mục tiêu KHÔNG THỂ thực hiện tại điểm đến (ví dụ trượt tuyết ở nơi không có tuyết, lặn biển ở tỉnh không giáp biển), hoặc thời tiết cả 7 ngày đều chặn mục tiêu chính, hoặc điểm đến không phù hợp căn bản với mục tiêu.
- "warn" nếu làm được nhưng có rủi ro đáng kể (mưa nhiều ngày, mùa cao điểm, ngân sách eo hẹp).
- "ok" nếu hợp lý.

Khi block hoặc warn, phải nêu gợi ý cụ thể: đổi mục tiêu sang việc gì, hoặc đổi điểm đến nào phù hợp hơn với chính mục tiêu đó.

JSON schema:
{
  "verdict": "ok" | "warn" | "block",
  "issues": [{"title": string, "detail": string}],
  "suggestions": [{"title": string, "detail": string}]
}
Tối đa 3 issue và 3 suggestion. Viết ngắn, mỗi detail dưới 25 từ.`,
  })

  const issues = data.issues ?? []
  const suggestions = data.suggestions ?? []
  let verdict = ['ok', 'warn', 'block'].includes(data.verdict) ? data.verdict : 'ok'

  // Chan ngan sach bang quy tac cung, khong phu thuoc phan doan cua LLM.
  if (budget < floor) {
    verdict = 'block'
    issues.unshift({
      title: 'Ngân sách không đủ',
      detail: `Chuyến ${distanceKm} km trong 7 ngày cần tối thiểu khoảng ${floor.toLocaleString('vi-VN')} VND.`,
    })
    suggestions.unshift({
      title: 'Tăng ngân sách hoặc rút ngắn quãng đường',
      detail: `Nâng lên ${floor.toLocaleString('vi-VN')} VND, hoặc chọn điểm đến gần hơn.`,
    })
  }

  return { verdict, issues, suggestions, from, to, distanceKm, budgetFloor: floor }
}

/**
 * Ke hoach khoi hanh: phuong tien, chuyen di, do dac.
 */
export async function getTripPlan(departure, destination, budget, objective, weather) {
  const { from, to, distanceKm } = await getRoute(departure, destination)

  const plan = await chatJson({
    system: SYSTEM,
    user: `Lập kế hoạch khởi hành 7 ngày.
Điểm đi: ${departure}. Điểm đến: ${destination}. Khoảng cách đường chim bay: ${distanceKm} km.
Quy tắc phương tiện bắt buộc theo khoảng cách — ${distanceRule(distanceKm)}.
Ngân sách: ${budget} VND. Mục tiêu: ${objective || 'nghỉ dưỡng'}.
Thời tiết 7 ngày tại điểm đến: ${weatherDigest(weather)}.

JSON schema:
{
  "vehicles": [{"name": string, "reason": string, "estimatedCost": number, "durationHours": number}],
  "trips": [{"operator": string, "departTime": string, "arriveTime": string, "price": number}],
  "packing": [{"item": string, "reason": string}],
  "note": string
}
vehicles tối đa 3, trips tối đa 3, packing tối đa 6. estimatedCost và price là số VND.`,
  })

  return { ...plan, distanceKm, from, to }
}

/**
 * Gan gia uoc luong + mo ta vao danh sach POI CO THAT lay tu OSM.
 * LLM chi duoc chu thich, khong duoc them/bot/doi ten.
 */
async function annotate({ items, location, budget, priceField, priceHint }) {
  if (!items.length) return items

  const listing = items
    .map((item, i) => {
      const facts = [item.kindLabel, item.cuisine, item.address || 'chưa rõ địa chỉ']
        .filter(Boolean)
        .join(' — ')
      return `${i}. ${item.name} — ${facts}`
    })
    .join('\n')

  try {
    const data = await chatJson({
      system: SYSTEM,
      user: `Dưới đây là danh sách CÓ THẬT tại ${location}, lấy từ OpenStreetMap.
Nhiệm vụ: ước lượng ${priceHint} (số VND) và viết một câu mô tả ngắn cho từng mục.

RÀNG BUỘC: không thêm, không bớt, không đổi tên, không đổi thứ tự.
Trả về đúng ${items.length} phần tử, index từ 0 đến ${items.length - 1}.
Nếu không biết chắc, hãy ước lượng theo mặt bằng giá chung của khu vực.

${listing}

Ngân sách tham khảo của chuyến đi: ${budget} VND.

JSON schema:
{"items": [{"index": number, "price": number, "highlight": string}]}`,
    })

    const byIndex = new Map((data.items ?? []).map((row) => [row.index, row]))
    return items.map((item, i) => ({
      ...item,
      [priceField]: byIndex.get(i)?.price ?? null,
      highlight: byIndex.get(i)?.highlight ?? null,
      priceEstimated: true,
    }))
  } catch {
    // Mat phan gia van con du lieu that: hien thi khong gia con hon bia.
    return items.map((item) => ({ ...item, [priceField]: null, priceEstimated: true }))
  }
}

/**
 * Dia diem tham quan, nha hang, hoat dong.
 * - attractions/activities: LLM (landmark noi tieng, model biet chinh xac)
 * - restaurants: OpenStreetMap that, LLM chi uoc luong gia
 */
export async function getPlaces(location, budget) {
  const place = await geocode(location)

  const [llm, restaurants] = await Promise.all([
    chatJson({
      system: SYSTEM,
      user: `Gợi ý địa điểm tại ${location} cho chuyến 7 ngày, ngân sách ${budget} VND.
Chỉ nêu địa danh nổi tiếng có thật, không bịa tên.

JSON schema:
{
  "attractions": [{"name": string, "area": string, "ticketPrice": number, "highlight": string}],
  "activities": [{"name": string, "price": number, "note": string}]
}
Mỗi mảng 4-6 mục. Giá là số VND, miễn phí thì 0.`,
    }),
    searchRestaurants(place, 6)
      .then(async ({ items, source }) => ({
        items: await annotate({
          items,
          location,
          budget,
          priceField: 'avgPrice',
          priceHint: 'giá trung bình một bữa cho một người',
        }),
        source,
      }))
      .catch(() => null),
  ])

  return {
    attractions: llm.attractions ?? [],
    activities: llm.activities ?? [],
    restaurants: restaurants?.items ?? [],
    restaurantSource: restaurants?.source ?? 'unavailable',
    place,
  }
}

/**
 * Cho o that tu OpenStreetMap. LLM chi uoc luong gia phong.
 * Rating lay tu tag `stars` cua OSM, khong co thi de trong.
 */
export async function getHotels(location, budget) {
  const place = await geocode(location)
  const { items, source } = await searchStays(place, 6)
  const hotels = await annotate({
    items,
    location,
    budget,
    priceField: 'pricePerNight',
    priceHint: 'giá phòng một đêm',
  })
  return { hotels, source, place }
}

/**
 * Tong hop tat ca data thanh lich 7 ngay.
 */
export async function generateSchedule({
  departure,
  destination,
  budget,
  objective,
  weather,
  tripPlan,
  places,
  hotels,
  transport,
}) {
  const data = await chatJson({
    system: SYSTEM,
    temperature: 0.5,
    user: `Tổng hợp lịch trình 7 ngày từ dữ liệu đã có. Không bịa địa điểm ngoài danh sách.

Đi từ ${departure} đến ${destination}. Ngân sách ${budget} VND. Mục tiêu: ${objective || 'nghỉ dưỡng'}.
Thời tiết: ${weatherDigest(weather)}
Phương tiện khả dụng: ${JSON.stringify(tripPlan?.vehicles ?? [])}
Địa điểm: ${JSON.stringify(places ?? {})}
Chỗ ở: ${JSON.stringify(hotels?.hotels?.slice(0, 3) ?? [])}
Bảng giá xe nội thành: ${JSON.stringify((transport ?? []).map((t) => ({ name: t.name, base: t.base, perKm: t.perKm })))}

JSON schema:
{
  "days": [{
    "day": number,
    "date": string,
    "title": string,
    "morning": string,
    "afternoon": string,
    "evening": string,
    "transport": string,
    "cost": number
  }],
  "totalCost": number,
  "budgetFit": "dưới ngân sách"|"vừa ngân sách"|"vượt ngân sách",
  "advice": string
}
Đúng 7 phần tử days, date lấy theo thứ tự ngày trong dữ liệu thời tiết. cost là số VND của riêng ngày đó. Ngày mưa ưu tiên hoạt động trong nhà.`,
  })
  return data
}
