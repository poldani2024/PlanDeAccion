import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export const authApi = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  updateMe: (data: Partial<{ name: string; avatar: string; timezone: string }>) =>
    api.patch('/auth/me', data),
  updateSettings: (data: Record<string, unknown>) =>
    api.patch('/auth/settings', data),
};

// Objectives
export const objectivesApi = {
  list: (status?: string) => api.get('/objectives', { params: { status } }),
  create: (data: Record<string, unknown>) => api.post('/objectives', data),
  get: (id: string) => api.get(`/objectives/${id}`),
  update: (id: string, data: Record<string, unknown>) => api.patch(`/objectives/${id}`, data),
  updateStatus: (id: string, status: string) => api.patch(`/objectives/${id}/status`, { status }),
  delete: (id: string) => api.delete(`/objectives/${id}`),
};

// Actions
export const actionsApi = {
  listByObjective: (objectiveId: string) => api.get(`/actions/objective/${objectiveId}`),
  create: (data: Record<string, unknown>) => api.post('/actions', data),
  update: (id: string, data: Record<string, unknown>) => api.patch(`/actions/${id}`, data),
  delete: (id: string) => api.delete(`/actions/${id}`),
};

// Daily Logs
export const dailyLogsApi = {
  listByObjective: (objectiveId: string) => api.get(`/daily-logs/objective/${objectiveId}`),
  create: (data: Record<string, unknown>) => api.post('/daily-logs', data),
  today: (objectiveId: string) => api.get(`/daily-logs/today/${objectiveId}`),
};

// Weekly Reviews
export const weeklyReviewsApi = {
  listByObjective: (objectiveId: string) => api.get(`/weekly-reviews/objective/${objectiveId}`),
  create: (data: Record<string, unknown>) => api.post('/weekly-reviews', data),
  pending: () => api.get('/weekly-reviews/pending'),
};

// Stats
export const statsApi = {
  dashboard: () => api.get('/stats/dashboard'),
  objective: (objectiveId: string) => api.get(`/stats/objective/${objectiveId}`),
  heatmap: () => api.get('/stats/activity-heatmap'),
};

// NLP
export const nlpApi = {
  techniques: () => api.get('/nlp/techniques'),
  technique: (key: string) => api.get(`/nlp/techniques/${key}`),
  createSession: (data: Record<string, unknown>) => api.post('/nlp/sessions', data),
};

// Achievements
export const achievementsApi = {
  list: () => api.get('/achievements'),
};

export default api;
