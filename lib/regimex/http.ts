import "server-only"

export class UpstreamTimeoutError extends Error {
  constructor(label: string, timeoutMs: number) {
    super(`${label} request timed out after ${timeoutMs}ms`)
    this.name = "UpstreamTimeoutError"
  }
}

export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs = 10_000,
  label = "Upstream",
) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await fetch(input, {
      ...init,
      signal: init.signal ?? controller.signal,
    })
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new UpstreamTimeoutError(label, timeoutMs)
    }
    throw error
  } finally {
    clearTimeout(timeout)
  }
}
