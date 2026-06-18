// Thin fetch wrapper around the Spring Boot API. Holds the JWT in memory and
// attaches it as a Bearer token; AuthContext keeps it in sync with localStorage.
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'

let token = null
export function setToken(t) {
  token = t
}

export async function api(path, { method = 'GET', body } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body != null ? JSON.stringify(body) : undefined,
  })

  if (res.status === 204) return null

  const data = await res.json().catch(() => null)
  if (!res.ok) {
    const err = new Error(data?.error || `Request failed (${res.status})`)
    err.status = res.status
    throw err
  }
  return data
}
