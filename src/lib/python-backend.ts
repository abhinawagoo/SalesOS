const PY = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000'

export async function callPython<T = unknown>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${PY}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Python backend error ${res.status}: ${text}`)
  }

  return res.json() as Promise<T>
}
