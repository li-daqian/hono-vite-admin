export function formatAuditDateTime(value: Date | string): string {
  return new Date(value).toLocaleString()
}

export function formatAuditLabel(value: string): string {
  return value
    .split(/[-_.]/g)
    .filter(Boolean)
    .map(segment => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ')
}

export function formatAuditOperator(entry: { operatorDisplayName?: string | null, operatorUsername: string }): string {
  const displayName = entry.operatorDisplayName?.trim()
  return displayName ? `${displayName} (${entry.operatorUsername})` : entry.operatorUsername
}
