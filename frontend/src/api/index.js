import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
  sendOtp: (mobile) => api.post('/auth/send-otp', { mobile }),
  verifyOtp: (mobile, otp) => api.post('/auth/verify-otp', { mobile, otp }),
  changePassword: (oldPwd, newPwd) => api.post(`/auth/change-password?old_password=${oldPwd}&new_password=${newPwd}`),
};

// ─── Societies ────────────────────────────────────────────────────────────────
export const societiesApi = {
  list: (params) => api.get('/societies/', { params }),
  get: (id) => api.get(`/societies/${id}`),
  create: (data) => api.post('/societies/', data),
  update: (id, data) => api.put(`/societies/${id}`, data),
  delete: (id) => api.delete(`/societies/${id}`),
  dashboard: (id) => api.get(`/societies/${id}/dashboard`),
  towers: (id) => api.get(`/societies/${id}/towers`),
  createTower: (id, data) => api.post(`/societies/${id}/towers`, data),
  flats: (id, params) => api.get(`/societies/${id}/flats`, { params }),
  createFlat: (id, data) => api.post(`/societies/${id}/flats`, data),
};

// ─── Users ────────────────────────────────────────────────────────────────────
export const usersApi = {
  list: (params) => api.get('/users/', { params }),
  create: (data) => api.post('/users/', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  approve: (id) => api.post(`/users/${id}/approve`),
};

// ─── Billing ──────────────────────────────────────────────────────────────────
export const billingApi = {
  bills: (sId, params) => api.get(`/societies/${sId}/bills`, { params }),
  createBill: (sId, data) => api.post(`/societies/${sId}/bills`, data),
  generateBulk: (sId, month, year) => api.post(`/societies/${sId}/bills/generate-bulk?month=${month}&year=${year}`),
  pay: (sId, billId, data) => api.post(`/societies/${sId}/bills/${billId}/pay`, data),
  transactions: (sId, params) => api.get(`/societies/${sId}/transactions`, { params }),
  createTransaction: (sId, data) => api.post(`/societies/${sId}/transactions`, data),
  summary: (sId, params) => api.get(`/societies/${sId}/transactions/summary`, { params }),
  defaulters: (sId, params) => api.get(`/societies/${sId}/defaulters`, { params }),
};

// ─── Complaints ───────────────────────────────────────────────────────────────
export const complaintsApi = {
  list: (sId, params) => api.get(`/societies/${sId}/complaints`, { params }),
  create: (sId, data) => api.post(`/societies/${sId}/complaints`, data),
  update: (sId, id, data) => api.put(`/societies/${sId}/complaints/${id}`, data),
};

// ─── Visitors ─────────────────────────────────────────────────────────────────
export const visitorsApi = {
  list: (sId, params) => api.get(`/societies/${sId}/visitors`, { params }),
  create: (sId, data) => api.post(`/societies/${sId}/visitors`, data),
  checkin: (sId, id, otp) => api.post(`/societies/${sId}/visitors/${id}/checkin?otp=${otp}`),
  checkout: (sId, id) => api.post(`/societies/${sId}/visitors/${id}/checkout`),
};

// ─── Announcements ────────────────────────────────────────────────────────────
export const announcementsApi = {
  list: (sId, params) => api.get(`/societies/${sId}/announcements`, { params }),
  create: (sId, data) => api.post(`/societies/${sId}/announcements`, data),
  delete: (sId, id) => api.delete(`/societies/${sId}/announcements/${id}`),
};

// ─── Assets ───────────────────────────────────────────────────────────────────
export const assetsApi = {
  list: (sId) => api.get(`/societies/${sId}/assets`),
  create: (sId, data) => api.post(`/societies/${sId}/assets`, data),
  addLog: (sId, assetId, data) => api.post(`/societies/${sId}/assets/${assetId}/logs`, data),
};

// ─── Vendors ──────────────────────────────────────────────────────────────────
export const vendorsApi = {
  list: (sId) => api.get(`/societies/${sId}/vendors`),
  create: (sId, data) => api.post(`/societies/${sId}/vendors`, data),
};

// ─── Budget ───────────────────────────────────────────────────────────────────
export const budgetApi = {
  list: (sId, params) => api.get(`/societies/${sId}/budget`, { params }),
  create: (sId, data) => api.post(`/societies/${sId}/budget`, data),
};

// ─── Polls ────────────────────────────────────────────────────────────────────
export const pollsApi = {
  list: (sId) => api.get(`/societies/${sId}/polls`),
  create: (sId, data) => api.post(`/societies/${sId}/polls`, data),
  vote: (sId, id, optionIndex) => api.post(`/societies/${sId}/polls/${id}/vote`, { option_index: optionIndex }),
};

// ─── Audit ────────────────────────────────────────────────────────────────────
export const auditApi = {
  list: (sId, params) => api.get(`/societies/${sId}/audit`, { params }),
};

// ─── Settings ─────────────────────────────────────────────────────────────────
export const settingsApi = {
  getAll: (category) => api.get('/settings/', { params: { category } }),
  update: (data) => api.put('/settings/', data),
  bulkUpdate: (data) => api.put('/settings/bulk', data),
  testDb: (data) => api.post('/settings/database/test', data),
  switchDb: (data) => api.post('/settings/database/switch', data),
  testNotification: (channel, recipient, message) =>
    api.post(`/settings/notifications/test?channel=${channel}&recipient=${recipient}&message=${message}`),
};
