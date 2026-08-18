export function isValidGroqApiKey(value: string) {
  return /^gsk_[A-Za-z0-9_-]{20,}$/.test(value.trim());
}
