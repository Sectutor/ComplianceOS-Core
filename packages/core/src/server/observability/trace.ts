export type Span = {
  end: () => void
}

export function startSpan(name: string, meta?: Record<string, unknown>): Span {
  const id = Math.random().toString(36).slice(2)
  console.log(`[span:start] ${name} ${id}`, meta || {})
  return {
    end: () => console.log(`[span:end] ${name} ${id}`)
  }
}
