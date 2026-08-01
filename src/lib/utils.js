import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function timeAgo(date) {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ptBR })
}

export function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}

export function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
}
