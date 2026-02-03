export type LogLevel = 'info' | 'error' | 'warn' | 'debug';

function emit(level: LogLevel, data: Record<string, unknown>) {
  try {
    const payload = { level, ts: new Date().toISOString(), ...data };
    process.stdout.write(JSON.stringify(payload) + "\n");
  } catch (err) {
    // Fallback for circular references or other stringify errors
    process.stdout.write(JSON.stringify({
      level,
      ts: new Date().toISOString(),
      message: 'Logger serialization failed',
      originalMessage: (data as any).message
    }) + "\n");
    // Also print raw to stderr for debugging
    console.error("Raw Log Data:", data);
  }
}

export const logger = {
  info: (data: Record<string, unknown> | string) => emit('info', typeof data === 'string' ? { message: data } : data),
  error: (data: Record<string, unknown> | string) => emit('error', typeof data === 'string' ? { message: data } : data),
  warn: (data: Record<string, unknown> | string) => emit('warn', typeof data === 'string' ? { message: data } : data),
  debug: (data: Record<string, unknown> | string) => emit('debug', typeof data === 'string' ? { message: data } : data),
};

