export function parseTimeDuration(duration: string): Date {
  // Regular expressions to match different time units
  const regex = /^(\d+)([smhdwMy])$/

  const match = duration.match(regex)
  if (!match) {
    throw new Error('Invalid duration format')
  }

  const value = Number.parseInt(match[1]!, 10)
  const unit = match[2]!

  const now = new Date()

  switch (unit) {
    case 's': // seconds
      now.setSeconds(now.getSeconds() + value)
      break
    case 'm': // minutes
      now.setMinutes(now.getMinutes() + value)
      break
    case 'h': // hours
      now.setHours(now.getHours() + value)
      break
    case 'd': // days
      now.setDate(now.getDate() + value)
      break
    case 'w': // weeks
      now.setDate(now.getDate() + value * 7)
      break
    case 'M': // months
      now.setMonth(now.getMonth() + value)
      break
    case 'y': // years
      now.setFullYear(now.getFullYear() + value)
      break
    default:
      throw new Error('Unknown time unit.')
  }

  return now
}
