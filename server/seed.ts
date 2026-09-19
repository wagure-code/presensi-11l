import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import db, { initSchema, pool } from './db.js';

const GURU_USERNAME = process.env.SEED_GURU_USERNAME || 'guru';
const GURU_PASSWORD = process.env.SEED_GURU_PASSWORD || 'guru12345';
const GURU_NAME = process.env.SEED_GURU_NAME || 'Wali Kelas';
const CLASS_NAME = process.env.SEED_CLASS_NAME || 'XII IPA 1';

async function main() {
  console.log('Menyiapkan skema database...');
  await initSchema();

  const existing = await db.prepare('SELECT id FROM users WHERE username = ?').get(GURU_USERNAME);

  if (existing) {
    console.log(`Akun guru "${GURU_USERNAME}" sudah ada. Tidak membuat duplikat.`);
  } else {
    const id = randomUUID();
    await db.prepare(`INSERT INTO users (id, username, passwordHash, role, name, className, createdAt)
      VALUES (?, ?, ?, 'guru', ?, ?, ?)`)
      .run(id, GURU_USERNAME, bcrypt.hashSync(GURU_PASSWORD, 10), GURU_NAME, CLASS_NAME, new Date().toISOString());
    console.log('Akun guru berhasil dibuat:');
    console.log(`  Username : ${GURU_USERNAME}`);
    console.log(`  Password : ${GURU_PASSWORD}`);
    console.log(`  Kelas    : ${CLASS_NAME}`);
    console.log('\nSegera login dan ganti password ini setelah deploy.');
  }

  await pool.end();
}

main().catch((err) => {
  console.error('Seed gagal:', err);
  process.exit(1);
});
