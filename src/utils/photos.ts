// Kolom homeworks.photoUrl dulu berisi 1 URL polos. Sekarang bisa banyak foto:
// disimpan sebagai string JSON array. Helper ini membaca dua-duanya.
export const MAX_HOMEWORK_PHOTOS = 5;

export function parsePhotoUrls(value?: string | null): string[] {
  if (!value) return [];
  const v = value.trim();
  if (v.startsWith('[')) {
    try {
      const arr = JSON.parse(v);
      return Array.isArray(arr) ? arr.filter((u) => typeof u === 'string' && u) : [];
    } catch {
      return [];
    }
  }
  return [v];
}

export function serializePhotoUrls(urls: string[]): string | undefined {
  return urls.length > 0 ? JSON.stringify(urls) : undefined;
}
