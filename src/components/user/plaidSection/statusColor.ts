export function statusColor(status: string): 'success' | 'warning' | 'error' | 'default' {
  if (status === 'active') return 'success'
  if (status === 'error') return 'error'
  return 'default'
}
