import { format, formatDistanceToNow, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// ── Moeda ─────────────────────────────────────────────────────────────────────
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatCurrencyCompact(value: number): string {
  if (Math.abs(value) >= 1_000_000) {
    return `R$ ${(value / 1_000_000).toFixed(1)}M`
  }
  if (Math.abs(value) >= 1_000) {
    return `R$ ${(value / 1_000).toFixed(1)}k`
  }
  return formatCurrency(value)
}

// ── Datas ─────────────────────────────────────────────────────────────────────
export function formatDate(dateString: string): string {
  return format(parseISO(dateString), 'dd/MM/yyyy', { locale: ptBR })
}

export function formatDateLong(dateString: string): string {
  return format(parseISO(dateString), "d 'de' MMMM 'de' yyyy", { locale: ptBR })
}

export function formatDateShort(dateString: string): string {
  return format(parseISO(dateString), 'dd MMM', { locale: ptBR })
}

export function formatMonth(dateString: string): string {
  return format(parseISO(dateString), 'MMMM yyyy', { locale: ptBR })
}

export function formatRelativeTime(dateString: string): string {
  return formatDistanceToNow(parseISO(dateString), { addSuffix: true, locale: ptBR })
}

export function toFirstDayOfMonth(date: Date = new Date()): string {
  return format(new Date(date.getFullYear(), date.getMonth(), 1), 'yyyy-MM-dd')
}

// ── Texto ─────────────────────────────────────────────────────────────────────
export function getInitials(name: string): string {
  return name
    .trim()
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('')
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength)}...`
}
