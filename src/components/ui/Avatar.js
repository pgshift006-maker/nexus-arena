import { getInitials } from '@/lib/utils'

export default function Avatar({ name, url, size = 36, className = '' }) {
  const px = `${size}px`

  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={name ?? 'Avatar'}
        style={{ width: px, height: px }}
        className={`rounded-full object-cover shrink-0 ${className}`}
      />
    )
  }

  return (
    <div
      style={{ width: px, height: px, fontSize: `${Math.round(size * 0.38)}px` }}
      className={`rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold shrink-0 ${className}`}
    >
      {getInitials(name)}
    </div>
  )
}
