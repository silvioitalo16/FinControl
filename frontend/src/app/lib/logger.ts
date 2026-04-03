type LogLevel = 'info' | 'warn' | 'error'

interface LogMeta {
  [key: string]: unknown
}

const COLORS: Record<LogLevel, string> = {
  info:  '#10b981',
  warn:  '#f59e0b',
  error: '#ef4444',
}

const isDev = import.meta.env.DEV
const API_URL = import.meta.env.VITE_API_URL ?? ''

// ── Envio de logs de erro para o backend ──────────────────────────────────────
async function sendToBackend(level: LogLevel, message: string, data?: unknown) {
  if (!API_URL) return
  try {
    await fetch(`${API_URL}/api/logs`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        level,
        message,
        data,
        timestamp: new Date().toISOString(),
        url:       window.location.href,
        userAgent: navigator.userAgent,
      }),
    })
  } catch {
    // Silencioso — não cria loop infinito de logs
  }
}

// ── Logger principal ──────────────────────────────────────────────────────────
function log(level: LogLevel, message: string, meta?: LogMeta) {
  const timestamp = new Date().toISOString()
  const prefix    = `[${timestamp}] [${level.toUpperCase()}]`

  if (isDev) {
    const style = `color: ${COLORS[level]}; font-weight: bold`
    if (meta !== undefined) {
      console[level](`%c${prefix} ${message}`, style, meta)
    } else {
      console[level](`%c${prefix} ${message}`, style)
    }
  }

  // Envia todos os níveis para o backend (visível no terminal)
  void sendToBackend(level, message, meta)
}

export const logger = {
  info:  (message: string, meta?: LogMeta) => log('info',  message, meta),
  warn:  (message: string, meta?: LogMeta) => log('warn',  message, meta),
  error: (message: string, meta?: LogMeta) => log('error', message, meta),
}
