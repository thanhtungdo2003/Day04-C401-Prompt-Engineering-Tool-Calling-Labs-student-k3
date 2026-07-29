// Helper goi Groq API (endpoint tuong thich OpenAI).
// Luu y: key nam o frontend => bundle public. Chi dung cho demo/lab.
const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL = 'llama-3.3-70b-versatile'
const GROQ_API_KEY = (import.meta.env ?? {}).VITE_GROQ_API_KEY ?? ''

export function hasGroqKey() {
  return GROQ_API_KEY.trim().length > 0
}

export class GroqError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'GroqError'
    this.status = status
  }
}

// Khong co timeout thi mot request treo se lam ca pipeline dung im vo han.
const TIMEOUT_MS = 40000
const RETRY_DELAYS_MS = [1200, 3500]
const RETRYABLE = new Set([408, 429, 500, 502, 503, 504])

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function postOnce(payload) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const res = await fetch(GROQ_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })

    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      throw new GroqError(`Groq ${res.status}: ${detail.slice(0, 200)}`, res.status)
    }

    const data = await res.json()
    return data.choices?.[0]?.message?.content ?? ''
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new GroqError(`Groq quá ${TIMEOUT_MS / 1000}s không phản hồi`, 408)
    }
    throw err
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Chat completion co ban. Tu retry khi gap loi tam thoi hoac timeout.
 * @param {{system?: string, user: string, json?: boolean, temperature?: number, maxTokens?: number}} opts
 */
export async function chatCompletion({
  system,
  user,
  json = false,
  temperature = 0.4,
  maxTokens = 2600,
}) {
  if (!hasGroqKey()) {
    throw new GroqError('Thiếu VITE_GROQ_API_KEY trong .env', 401)
  }

  const messages = []
  if (system) messages.push({ role: 'system', content: system })
  messages.push({ role: 'user', content: user })

  const payload = {
    model: GROQ_MODEL,
    messages,
    temperature,
    max_tokens: maxTokens,
    ...(json ? { response_format: { type: 'json_object' } } : {}),
  }

  let lastError = null
  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt += 1) {
    if (attempt) await sleep(RETRY_DELAYS_MS[attempt - 1])
    try {
      return await postOnce(payload)
    } catch (err) {
      lastError = err
      const status = err.status
      // Sai key hoac sai request thi retry cung vo ich.
      if (status && !RETRYABLE.has(status)) throw err
    }
  }

  throw lastError
}

/**
 * Chat completion o JSON mode, tra ve object da parse.
 */
export async function chatJson({ system, user, temperature = 0.3, maxTokens }) {
  const raw = await chatCompletion({
    system: `${system}\n\nChi tra ve JSON hop le, khong kem markdown fence.`,
    user,
    json: true,
    temperature,
    maxTokens,
  })

  try {
    return JSON.parse(raw)
  } catch {
    const match = raw.match(/\{[\s\S]*\}/)
    if (match) return JSON.parse(match[0])
    throw new GroqError('Groq tra ve JSON khong parse duoc')
  }
}

export const GROQ_INFO = { endpoint: GROQ_ENDPOINT, model: GROQ_MODEL }
