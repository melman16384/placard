import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO } from 'date-fns'
import { de } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date) {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'dd. MMMM yyyy', { locale: de })
}

export function formatTime(date: string | Date) {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'HH:mm', { locale: de })
}

export function formatDatetime(date: string | Date) {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'dd.MM.yyyy HH:mm', { locale: de })
}

export function formatWeekday(date: string | Date) {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'EEEE, dd. MMMM', { locale: de })
}

export const AMENITY_LABELS: Record<string, string> = {
  projector: 'Beamer',
  whiteboard: 'Whiteboard',
  video_conf: 'Videokonferenz',
  phone: 'Telefon',
  tv: 'Fernseher',
  coffee: 'Kaffee',
  ac: 'Klimaanlage',
}

export const AMENITY_ICONS: Record<string, string> = {
  projector: '📽️',
  whiteboard: '🖊️',
  video_conf: '📹',
  phone: '📞',
  tv: '📺',
  coffee: '☕',
  ac: '❄️',
}
