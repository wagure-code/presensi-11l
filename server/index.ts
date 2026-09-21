import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import db, { initSchema } from './db.js';
import { signToken, requireAuth, requireGuru } from './auth.js';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;

// Wraps an async route handler so a rejected promise becomes a 500 instead of crashing the process.
const ah = (fn: (req: Request, res: Response) => Promise<any>) => (req: Request, res: Response, next: NextFunction) => {
  fn(req, res).catch((err) => {
    console.error(err);
    res.status(500).json({ error: 'Terjadi kesalahan pada server.' });
  });
};

// ---------- AUTH ----------

// Login (guru & siswa)
app.post('/api/auth/login', ah(async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username dan password wajib diisi.' });

  const user = await db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any;
  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    return res.status(401).json({ error: 'Username atau password salah.' });
  }

  const payload = { id: user.id, username: user.username, role: user.role, className: user.className, name: user.name };
  const token = signToken(payload);
  res.json({ token, user: { ...payload, nis: user.nis, schoolName: user.schoolName, semester: user.semester, avatarEmoji: user.avatarEmoji } });
}));

// Guru creates a new siswa account
app.post('/api/auth/register-siswa', requireAuth, requireGuru, ah(async (req, res) => {
  const { username, password, name, nis, schoolName, semester, avatarEmoji } = req.body;
  if (!username || !password || !name) return res.status(400).json({ error: 'Username, password, dan nama wajib diisi.' });

  const existing = await db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) return res.status(409).json({ error: 'Username sudah dipakai.' });

  const id = randomUUID();
  await db.prepare(`INSERT INTO users (id, username, passwordHash, role, name, nis, className, schoolName, semester, avatarEmoji, createdAt)
    VALUES (?, ?, ?, 'siswa', ?, ?, ?, ?, ?, ?, ?)`).run(
    id, username, bcrypt.hashSync(password, 10), name, nis || null, req.user!.className, schoolName || null, semester || null, avatarEmoji || '🧑‍🎓', new Date().toISOString()
  );
  res.status(201).json({ id, username, name });
}));

app.get('/api/auth/me', requireAuth, ah(async (req, res) => {
  const user = await db.prepare('SELECT id, username, role, name, nis, className, schoolName, semester, avatarEmoji FROM users WHERE id = ?').get(req.user!.id);
  res.json(user);
}));

// Update own profile (name, school, semester, avatar, nis)
app.put('/api/profile', requireAuth, ah(async (req, res) => {
  const { name, nis, schoolName, semester, avatarEmoji } = req.body;
  await db.prepare(`UPDATE users SET name=?, nis=?, schoolName=?, semester=?, avatarEmoji=? WHERE id=?`)
    .run(name, nis || null, schoolName || null, semester || null, avatarEmoji || null, req.user!.id);
  const updated = await db.prepare('SELECT id, username, role, name, nis, className, schoolName, semester, avatarEmoji FROM users WHERE id = ?').get(req.user!.id);
  res.json(updated);
}));

// Guru: list all students in their class
app.get('/api/students', requireAuth, requireGuru, ah(async (req, res) => {
  const students = await db.prepare(`SELECT id, username, name, nis, avatarEmoji FROM users WHERE role = 'siswa' AND className = ?`).all(req.user!.className);
  res.json(students);
}));

// Guru: reset a student's password
app.put('/api/students/:id/reset-password', requireAuth, requireGuru, ah(async (req, res) => {
  const { password } = req.body;
  if (!password || password.length < 6) return res.status(400).json({ error: 'Password baru minimal 6 karakter.' });
  const student = await db.prepare(`SELECT id FROM users WHERE id = ? AND role = 'siswa' AND className = ?`).get(req.params.id, req.user!.className);
  if (!student) return res.status(404).json({ error: 'Siswa tidak ditemukan di kelas ini.' });
  await db.prepare('UPDATE users SET passwordHash = ? WHERE id = ?').run(bcrypt.hashSync(password, 10), req.params.id);
  res.json({ ok: true });
}));

// Guru: remove a student account
app.delete('/api/students/:id', requireAuth, requireGuru, ah(async (req, res) => {
  const student = await db.prepare(`SELECT id FROM users WHERE id = ? AND role = 'siswa' AND className = ?`).get(req.params.id, req.user!.className);
  if (!student) return res.status(404).json({ error: 'Siswa tidak ditemukan di kelas ini.' });
  await db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  res.status(204).end();
}));

// ---------- SCHEDULES ----------

app.get('/api/schedules', requireAuth, ah(async (req, res) => {
  const rows = await db.prepare('SELECT * FROM schedules WHERE className = ?').all(req.user!.className);
  res.json(rows);
}));

const normalizeSchedule = (s: any) => ({
  day: s.day,
  startTime: s.startTime,
  endTime: s.endTime,
  subject: s.subject,
  teacher: s.teacher ?? null,
  room: s.room ?? null,
  colorTag: s.colorTag ?? null,
  onlineMeetingUrl: s.onlineMeetingUrl ?? null,
  onlinePlatform: s.onlinePlatform ?? null,
});

app.post('/api/schedules', requireAuth, requireGuru, ah(async (req, res) => {
  const s = normalizeSchedule(req.body);
  const id = req.body.id || randomUUID();
  await db.prepare(`INSERT INTO schedules (id, className, day, startTime, endTime, subject, teacher, room, colorTag, onlineMeetingUrl, onlinePlatform)
    VALUES (@id, @className, @day, @startTime, @endTime, @subject, @teacher, @room, @colorTag, @onlineMeetingUrl, @onlinePlatform)`)
    .run({ ...s, id, className: req.user!.className });
  res.status(201).json({ ...req.body, id });
}));

app.put('/api/schedules/:id', requireAuth, requireGuru, ah(async (req, res) => {
  const s = normalizeSchedule(req.body);
  await db.prepare(`UPDATE schedules SET day=@day, startTime=@startTime, endTime=@endTime, subject=@subject, teacher=@teacher,
    room=@room, colorTag=@colorTag, onlineMeetingUrl=@onlineMeetingUrl, onlinePlatform=@onlinePlatform
    WHERE id=@id AND className=@className`)
    .run({ ...s, id: req.params.id, className: req.user!.className });
  res.json({ ...req.body, id: req.params.id });
}));

app.delete('/api/schedules/:id', requireAuth, requireGuru, ah(async (req, res) => {
  await db.prepare('DELETE FROM schedules WHERE id = ? AND className = ?').run(req.params.id, req.user!.className);
  res.status(204).end();
}));

// ---------- DUTIES (piket) ----------

const DUTY_DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
const DEFAULT_DUTY_TASKS = ['Menyapu Lantai', 'Membersihkan Papan Tulis', 'Membuang Sampah'];

// Ensure every weekday has a duty row for this class so the frontend always has something real to update.
const ensureDefaultDuties = async (className: string) => {
  const existing = await db.prepare('SELECT day FROM duties WHERE className = ?').all(className) as any[];
  const existingDays = new Set(existing.map((r) => r.day));
  for (const day of DUTY_DAYS) {
    if (!existingDays.has(day)) {
      await db.prepare(`INSERT INTO duties (id, className, day, students, tasks) VALUES (?, ?, ?, ?, ?)`)
        .run(randomUUID(), className, day, JSON.stringify([]), JSON.stringify(DEFAULT_DUTY_TASKS));
    }
  }
};

app.get('/api/duties', requireAuth, ah(async (req, res) => {
  await ensureDefaultDuties(req.user!.className);
  const rows = await db.prepare('SELECT * FROM duties WHERE className = ?').all(req.user!.className) as any[];
  res.json(rows.map((r) => ({ ...r, students: JSON.parse(r.students), tasks: JSON.parse(r.tasks), isCompletedToday: !!r.isCompletedToday })));
}));

app.post('/api/duties', requireAuth, requireGuru, ah(async (req, res) => {
  const d = req.body;
  const id = d.id || randomUUID();
  await db.prepare(`INSERT INTO duties (id, className, day, students, tasks) VALUES (?, ?, ?, ?, ?)`)
    .run(id, req.user!.className, d.day, JSON.stringify(d.students || []), JSON.stringify(d.tasks || []));
  res.status(201).json({ ...d, id });
}));

app.put('/api/duties/:id', requireAuth, requireGuru, ah(async (req, res) => {
  const d = req.body;
  await db.prepare(`UPDATE duties SET day=?, students=?, tasks=? WHERE id=? AND className=?`)
    .run(d.day, JSON.stringify(d.students || []), JSON.stringify(d.tasks || []), req.params.id, req.user!.className);
  res.json({ ...d, id: req.params.id });
}));

// Toggle today's duty completion status — any student in that day's roster (or guru) can do this
app.post('/api/duties/:id/complete', requireAuth, ah(async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const completed = req.body?.completed !== false; // default true for backward compatibility
  await db.prepare('UPDATE duties SET isCompletedToday = ?, completedDate = ? WHERE id = ? AND className = ?')
    .run(completed ? 1 : 0, completed ? today : null, req.params.id, req.user!.className);
  res.json({ ok: true, isCompletedToday: completed });
}));

app.delete('/api/duties/:id', requireAuth, requireGuru, ah(async (req, res) => {
  await db.prepare('DELETE FROM duties WHERE id = ? AND className = ?').run(req.params.id, req.user!.className);
  res.status(204).end();
}));

// ---------- HOMEWORKS ----------

app.get('/api/homeworks', requireAuth, ah(async (req, res) => {
  const rows = await db.prepare('SELECT * FROM homeworks WHERE className = ? ORDER BY dueDate, dueTime').all(req.user!.className) as any[];
  const completions = await db.prepare('SELECT * FROM homework_completions WHERE userId = ?').all(req.user!.id) as any[];
  const completedMap = new Map(completions.map((c) => [c.homeworkId, c]));
  res.json(rows.map((hw) => {
    const c = completedMap.get(hw.id);
    return { ...hw, completed: !!c?.completed, completedAt: c?.completedAt || undefined };
  }));
}));

const normalizeHomework = (h: any) => ({
  title: h.title,
  subject: h.subject,
  dueDate: h.dueDate,
  dueTime: h.dueTime,
  priority: h.priority,
  category: h.category,
  description: h.description ?? null,
  submissionMode: h.submissionMode ?? null,
});

app.post('/api/homeworks', requireAuth, requireGuru, ah(async (req, res) => {
  const h = normalizeHomework(req.body);
  const id = req.body.id || randomUUID();
  await db.prepare(`INSERT INTO homeworks (id, className, title, subject, dueDate, dueTime, priority, category, description, submissionMode, createdAt, createdBy)
    VALUES (@id, @className, @title, @subject, @dueDate, @dueTime, @priority, @category, @description, @submissionMode, @createdAt, @createdBy)`)
    .run({ ...h, id, className: req.user!.className, createdAt: new Date().toISOString(), createdBy: req.user!.id });
  res.status(201).json({ ...req.body, id });
}));

app.put('/api/homeworks/:id', requireAuth, requireGuru, ah(async (req, res) => {
  const h = normalizeHomework(req.body);
  await db.prepare(`UPDATE homeworks SET title=@title, subject=@subject, dueDate=@dueDate, dueTime=@dueTime,
    priority=@priority, category=@category, description=@description, submissionMode=@submissionMode
    WHERE id=@id AND className=@className`)
    .run({ ...h, id: req.params.id, className: req.user!.className });
  res.json({ ...req.body, id: req.params.id });
}));

app.delete('/api/homeworks/:id', requireAuth, requireGuru, ah(async (req, res) => {
  await db.prepare('DELETE FROM homeworks WHERE id = ? AND className = ?').run(req.params.id, req.user!.className);
  res.status(204).end();
}));

// Siswa: toggle their own completion status for a homework item
app.post('/api/homeworks/:id/toggle', requireAuth, ah(async (req, res) => {
  const { completed } = req.body;
  const completedAt = completed ? new Date().toISOString() : null;
  await db.prepare(`INSERT INTO homework_completions (homeworkId, userId, completed, completedAt) VALUES (?, ?, ?, ?)
    ON CONFLICT(homeworkId, userId) DO UPDATE SET completed = excluded.completed, completedAt = excluded.completedAt`)
    .run(req.params.id, req.user!.id, completed ? 1 : 0, completedAt);
  res.json({ ok: true });
}));

// ---------- ATTENDANCE (presensi) ----------

// Siswa sees own attendance; guru sees whole class (pass ?all=1)
app.get('/api/attendance', requireAuth, ah(async (req, res) => {
  if (req.user!.role === 'guru' && req.query.all) {
    const rows = await db.prepare(`SELECT a.*, u.name as studentName FROM attendance a JOIN users u ON u.id = a.userId
      WHERE a.className = ? ORDER BY a.date DESC`).all(req.user!.className);
    return res.json(rows);
  }
  const rows = await db.prepare('SELECT * FROM attendance WHERE userId = ? ORDER BY date DESC').all(req.user!.id);
  res.json(rows);
}));

// Siswa submits their own presensi for the day (replaces any existing record for that date)
app.post('/api/attendance', requireAuth, ah(async (req, res) => {
  const a = req.body;
  const id = randomUUID();
  const now = new Date();
  const date = a.date || now.toISOString().split('T')[0];
  await db.prepare('DELETE FROM attendance WHERE userId = ? AND date = ?').run(req.user!.id, date);
  await db.prepare(`INSERT INTO attendance (id, userId, className, date, time, status, note, method, learningMode, networkStatus)
    VALUES (@id, @userId, @className, @date, @time, @status, @note, @method, @learningMode, @networkStatus)`)
    .run({
      id,
      userId: req.user!.id,
      className: req.user!.className,
      date,
      time: a.time || now.toTimeString().split(' ')[0],
      status: a.status,
      note: a.note || null,
      method: a.method || 'Mandiri (Portal Web)',
      learningMode: a.learningMode || null,
      networkStatus: a.networkStatus || null,
    });
  res.status(201).json({ ...a, id, date });
}));

// Guru manually records/edits attendance for a specific student
app.put('/api/attendance/:id', requireAuth, requireGuru, ah(async (req, res) => {
  const a = req.body;
  await db.prepare(`UPDATE attendance SET status=@status, note=@note, method=@method WHERE id=@id AND className=@className`)
    .run({ ...a, id: req.params.id, className: req.user!.className });
  res.json({ ...a, id: req.params.id });
}));

// Guru manually records attendance on behalf of a specific student (e.g. paper-based PTM roll call)
app.post('/api/attendance/manual', requireAuth, requireGuru, ah(async (req, res) => {
  const { studentId, date, time, status, note } = req.body;
  if (!studentId || !date || !status) return res.status(400).json({ error: 'studentId, date, dan status wajib diisi.' });

  const student = await db.prepare(`SELECT id FROM users WHERE id = ? AND role = 'siswa' AND className = ?`).get(studentId, req.user!.className);
  if (!student) return res.status(404).json({ error: 'Siswa tidak ditemukan di kelas ini.' });

  await db.prepare('DELETE FROM attendance WHERE userId = ? AND date = ?').run(studentId, date);
  const id = randomUUID();
  await db.prepare(`INSERT INTO attendance (id, userId, className, date, time, status, note, method)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'Manual Guru')`)
    .run(id, studentId, req.user!.className, date, time || '08:00:00', status, note || null);
  res.status(201).json({ id, studentId, date, time, status, note });
}));

// Delete an attendance record — only the student who submitted it, or a guru in the same class
app.delete('/api/attendance/:id', requireAuth, ah(async (req, res) => {
  const record = await db.prepare('SELECT * FROM attendance WHERE id = ?').get(req.params.id) as any;
  if (!record || record.className !== req.user!.className) {
    return res.status(404).json({ error: 'Data presensi tidak ditemukan.' });
  }
  if (record.userId !== req.user!.id && req.user!.role !== 'guru') {
    return res.status(403).json({ error: 'Anda hanya bisa menghapus presensi milik sendiri.' });
  }
  await db.prepare('DELETE FROM attendance WHERE id = ?').run(req.params.id);
  res.status(204).end();
}));

// ---------- LEARNING CYCLE ----------

app.get('/api/learning-cycle', requireAuth, ah(async (req, res) => {
  const row = await db.prepare('SELECT * FROM learning_cycle WHERE className = ?').get(req.user!.className);
  res.json(row || null);
}));

app.put('/api/learning-cycle', requireAuth, requireGuru, ah(async (req, res) => {
  const b = req.body;
  const c = {
    currentMode: b.currentMode,
    cycleMonthsOnline: b.cycleMonthsOnline ?? 2,
    cycleMonthsOffline: b.cycleMonthsOffline ?? 1,
    currentMonthInCycle: b.currentMonthInCycle ?? 1,
    cycleStartDate: b.cycleStartDate ?? null,
    onlinePlatformName: b.onlinePlatformName ?? null,
    defaultMeetLink: b.defaultMeetLink ?? null,
    cycleNotes: b.cycleNotes ?? null,
  };
  await db.prepare(`INSERT INTO learning_cycle (className, currentMode, cycleMonthsOnline, cycleMonthsOffline, currentMonthInCycle, cycleStartDate, onlinePlatformName, defaultMeetLink, cycleNotes)
    VALUES (@className, @currentMode, @cycleMonthsOnline, @cycleMonthsOffline, @currentMonthInCycle, @cycleStartDate, @onlinePlatformName, @defaultMeetLink, @cycleNotes)
    ON CONFLICT(className) DO UPDATE SET currentMode=excluded.currentMode, cycleMonthsOnline=excluded.cycleMonthsOnline,
      cycleMonthsOffline=excluded.cycleMonthsOffline, currentMonthInCycle=excluded.currentMonthInCycle,
      cycleStartDate=excluded.cycleStartDate, onlinePlatformName=excluded.onlinePlatformName,
      defaultMeetLink=excluded.defaultMeetLink, cycleNotes=excluded.cycleNotes`)
    .run({ ...c, className: req.user!.className });
  res.json(c);
}));

// Local/standalone server entrypoint. On Vercel, api/index.ts imports `app` directly instead.
if (process.env.VERCEL !== '1') {
  initSchema()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`Server Portal Akademik berjalan di http://localhost:${PORT}`);
      });
    })
    .catch((err) => {
      console.error('Gagal menyiapkan skema database:', err);
      process.exit(1);
    });
}

export default app;
