export function utf8ByteLength(value: string) {
  let bytes = 0;
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code < 0x80) bytes += 1;
    else if (code < 0x800) bytes += 2;
    else if (code >= 0xd800 && code <= 0xdbff && index + 1 < value.length) {
      const next = value.charCodeAt(index + 1);
      if (next >= 0xdc00 && next <= 0xdfff) {
        bytes += 4;
        index += 1;
      } else bytes += 3;
    } else bytes += 3;
  }
  return bytes;
}

export function getAsyncStorageEntriesBytes(entries: readonly (readonly [string, string | null])[]) {
  return entries.reduce((sum, [key, value]) => sum + utf8ByteLength(key) + utf8ByteLength(value ?? ""), 0);
}

export function getUsagePercent(usedBytes: number, totalBytes: number | null) {
  if (!totalBytes || totalBytes <= 0) return 0;
  return Math.min(100, Math.max(0, (usedBytes / totalBytes) * 100));
}

export function formatStorageBytes(bytes: number | null) {
  if (bytes === null || !Number.isFinite(bytes)) return "Недоступно";
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} КБ`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} МБ`;
  return `${(bytes / 1024 ** 3).toFixed(2)} ГБ`;
}
