# Portal Akademik & Presensi Siswa (Full-Stack)

Portal kelas dengan backend + database asli, mendukung dua peran (guru & siswa), siap di-deploy ke **Vercel** (frontend + API) dan **Supabase** (database Postgres).

## Struktur
- `api/[...all].ts` — pintu masuk serverless buat Vercel, tinggal nyerahin semua request ke Express app di `server/`
- `server/` — logic backend (auth JWT, semua endpoint API), sekarang connect ke Postgres asli lewat `pg`
- `src/` — frontend React + Vite

---

## A. Setup Database di Supabase

1. Buat akun & project baru di [supabase.com](https://supabase.com) (gratis, tier free cukup buat kelas)
2. Di dashboard project → **Settings → Database → Connection string**, kamu bakal lihat beberapa jenis koneksi:
   - **Connection pooling (Transaction mode, port 6543)** → dipakai nanti di Vercel
   - **Direct connection (port 5432)** → dipakai buat seeding dari komputer kamu
3. Copy kedua connection string itu, simpan dulu (ganti `[YOUR-PASSWORD]` dengan password database yang kamu set pas bikin project)

## B. Siapkan Schema & Akun Guru Pertama (dari komputer kamu)

1. `npm install`
2. Copy `.env.example` jadi `.env`, isi `DATABASE_URL` dengan **direct connection string** dari Supabase (port 5432), dan `JWT_SECRET` dengan string acak yang panjang
3. Jalankan:
   ```
   npm run seed
   ```
   Ini otomatis bikin semua tabel di Supabase + akun guru pertama (default: `guru` / `guru12345`, bisa diubah lewat env var `SEED_GURU_USERNAME` dkk — lihat `.env.example`)
4. Cek di Supabase dashboard → **Table Editor**, harusnya udah muncul tabel `users`, `schedules`, `duties`, dst.

## C. Deploy ke Vercel

1. Push project ini ke repo GitHub kamu (buat baru kalau belum ada)
2. Buka [vercel.com](https://vercel.com) → **Add New Project** → import repo GitHub tadi
3. Vercel bakal otomatis kedetek sebagai project Vite — biarin aja default build settings-nya (sudah diset lewat `vercel.json` di project ini)
4. Sebelum klik Deploy, buka **Environment Variables**, tambahkan:
   - `DATABASE_URL` → pakai **Transaction pooler connection string** dari Supabase (port **6543**, bukan yang 5432!) — penting karena Vercel serverless buka-tutup koneksi terus-terusan, pooler jauh lebih tahan
   - `JWT_SECRET` → sama persis dengan yang kamu pakai pas seeding di langkah B
5. Klik **Deploy**. Setelah selesai, Vercel kasih kamu URL (misal `portal-kelas.vercel.app`) — itu udah lengkap, frontend + API jadi satu domain, gak perlu setting tambahan apa-apa lagi
6. Buka URL-nya, login pakai akun guru dari langkah B

## Development Lokal (opsional, kalau mau ngoprek dulu sebelum deploy)

Backend & frontend jalan sebagai 2 proses terpisah:
```
npm run server    # terminal 1, port 4000 — butuh DATABASE_URL di .env
npm run dev        # terminal 2, port 3000
```
Untuk terminal 2 (`npm run dev`) supaya manggil `localhost:4000`, copy `.env.local.example` jadi `.env.local` (Vite otomatis baca file ini).

Kalau gak mau nyambung ke Supabase pas ngoprek lokal, kamu bisa install Postgres lokal juga dan arahkan `DATABASE_URL` ke situ — strukturnya sama persis, tinggal ganti connection string-nya.

## Environment Variables — Ringkasan

| Variable | Dipakai di | Isi |
|---|---|---|
| `DATABASE_URL` | seeding lokal & Vercel | connection string Postgres (Supabase) |
| `JWT_SECRET` | seeding lokal & Vercel | string rahasia buat sign token login — **harus sama** di kedua tempat |
| `VITE_API_URL` | dev lokal saja | `http://localhost:4000`, lewat `.env.local` |
| `SEED_GURU_*` | seeding lokal saja | data akun guru pertama |

## Langkah Berikutnya (belum termasuk di versi ini)

- **Web push notification** — belum ada, direncanakan sesi berikutnya
- **UI untuk guru menambah akun siswa** — sudah ada (tab "Panel Admin")
- **Ganti password default** setelah deploy pertama kali
