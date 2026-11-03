
export default function Avatar({
  name = 'User',
  size = 'md',
  className = '',
}) {
  const getInitials = (fullName) => {
    const words = fullName.trim().split(/\s+/).filter(Boolean)

    if (words.length === 0) return 'U'
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase()

    return (
      words[0][0] + words[words.length - 1][0]
    ).toUpperCase()
  }

  const sizes = {
    sm: 'h-9 w-9 text-xs',
    md: 'h-12 w-12 text-sm',
    lg: 'h-16 w-16 text-xl',
    xl: 'h-24 w-24 text-3xl',
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-maroon font-bold text-white ${sizes[size] || sizes.md} ${className}`}
      title={name}
    >
      {getInitials(name || 'User')}
    </div>
  )
}
