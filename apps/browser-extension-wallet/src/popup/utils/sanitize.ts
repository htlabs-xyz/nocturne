export function sanitizeInput(value: string): string {
  return value
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim();
}

export function sanitizeAddress(value: string): string {
  return value.replace(/[^a-zA-Z0-9_]/g, '');
}

export function sanitizeAmount(value: string): string {
  const cleaned = value.replace(/[^0-9.]/g, '');
  const parts = cleaned.split('.');
  if (parts.length > 2) {
    return parts[0] + '.' + parts.slice(1).join('');
  }
  return cleaned;
}
