import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

const PHOTO_BUCKET = 'tugas-foto';

/**
 * Uploads an image file straight from the browser to Supabase Storage and
 * returns its public URL. Requires VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
 * to be set, and a public bucket named "tugas-foto" to exist in the project.
 */
export async function uploadHomeworkPhoto(file: File): Promise<string> {
  if (!supabase) {
    throw new Error('Upload foto belum aktif: isi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY di .env.local / Vercel.');
  }

  const ext = file.name.split('.').pop() || 'jpg';
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error: uploadError } = await supabase.storage.from(PHOTO_BUCKET).upload(fileName, file, {
    cacheControl: '3600',
    upsert: false,
  });

  if (uploadError) {
    throw new Error(`Gagal mengunggah foto: ${uploadError.message}`);
  }

  const { data } = supabase.storage.from(PHOTO_BUCKET).getPublicUrl(fileName);
  return data.publicUrl;
}