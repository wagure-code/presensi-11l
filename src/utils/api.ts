// In production (Vercel) the frontend and API share one domain, so the default
// is a relative path. For local dev with `npm run server` + `npm run dev` running
// separately, set VITE_API_URL=http://localhost:4000 in a .env.local file.
const API_BASE = (import.meta as any).env?.VITE_API_URL || '';
const TOKEN_KEY = 'portal_siswa_token';

export const getToken = (): string | null => localStorage.getItem(TOKEN_KEY);
export const setToken = (token: string) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function apiFetch<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 204) return undefined as T;

  let data: any = null;
  try {
    data = await res.json();
  } catch {
    // no body
  }

  if (!res.ok) {
    throw new ApiError(data?.error || `Permintaan gagal (${res.status})`, res.status);
  }
  return data as T;
}

export const api = {
  login: (username: string, password: string) =>
    apiFetch<{ token: string; user: any }>('/api/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  me: () => apiFetch('/api/auth/me'),
  updateProfile: (p: any) => apiFetch('/api/profile', { method: 'PUT', body: JSON.stringify(p) }),
  registerSiswa: (payload: any) => apiFetch('/api/auth/register-siswa', { method: 'POST', body: JSON.stringify(payload) }),
  students: () => apiFetch('/api/students'),
  resetStudentPassword: (id: string, password: string) =>
    apiFetch(`/api/students/${id}/reset-password`, { method: 'PUT', body: JSON.stringify({ password }) }),
  deleteStudent: (id: string) => apiFetch(`/api/students/${id}`, { method: 'DELETE' }),

  schedules: () => apiFetch('/api/schedules'),
  createSchedule: (s: any) => apiFetch('/api/schedules', { method: 'POST', body: JSON.stringify(s) }),
  updateSchedule: (id: string, s: any) => apiFetch(`/api/schedules/${id}`, { method: 'PUT', body: JSON.stringify(s) }),
  deleteSchedule: (id: string) => apiFetch(`/api/schedules/${id}`, { method: 'DELETE' }),

  duties: () => apiFetch('/api/duties'),
  createDuty: (d: any) => apiFetch('/api/duties', { method: 'POST', body: JSON.stringify(d) }),
  updateDuty: (id: string, d: any) => apiFetch(`/api/duties/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
  completeDuty: (id: string, completed: boolean) => apiFetch(`/api/duties/${id}/complete`, { method: 'POST', body: JSON.stringify({ completed }) }),
  deleteDuty: (id: string) => apiFetch(`/api/duties/${id}`, { method: 'DELETE' }),

  homeworks: () => apiFetch('/api/homeworks'),
  createHomework: (h: any) => apiFetch('/api/homeworks', { method: 'POST', body: JSON.stringify(h) }),
  updateHomework: (id: string, h: any) => apiFetch(`/api/homeworks/${id}`, { method: 'PUT', body: JSON.stringify(h) }),
  deleteHomework: (id: string) => apiFetch(`/api/homeworks/${id}`, { method: 'DELETE' }),
  toggleHomework: (id: string, completed: boolean) =>
    apiFetch(`/api/homeworks/${id}/toggle`, { method: 'POST', body: JSON.stringify({ completed }) }),

  attendance: () => apiFetch('/api/attendance'),
  attendanceAll: () => apiFetch('/api/attendance?all=1'),
  submitAttendance: (a: any) => apiFetch('/api/attendance', { method: 'POST', body: JSON.stringify(a) }),
  updateAttendance: (id: string, a: any) => apiFetch(`/api/attendance/${id}`, { method: 'PUT', body: JSON.stringify(a) }),
  deleteAttendance: (id: string) => apiFetch(`/api/attendance/${id}`, { method: 'DELETE' }),
  manualAttendance: (payload: any) => apiFetch('/api/attendance/manual', { method: 'POST', body: JSON.stringify(payload) }),

  learningCycle: () => apiFetch('/api/learning-cycle'),
  updateLearningCycle: (c: any) => apiFetch('/api/learning-cycle', { method: 'PUT', body: JSON.stringify(c) }),
};
