import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const api = axios.create({
  baseURL: API,
  withCredentials: true,
});

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry && !original.url?.includes('/auth/')) {
      original._retry = true;
      try {
        await axios.post(`${API}/auth/refresh`, {}, { withCredentials: true });
        return api(original);
      } catch {
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

export function formatApiErrorDetail(detail) {
  if (detail == null) return "Something went wrong. Please try again.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail))
    return detail.map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e))).filter(Boolean).join(" ");
  if (detail && typeof detail.msg === "string") return detail.msg;
  return String(detail);
}

export const authApi = {
  register: (data) => api.post('/auth/register', data).then(r => r.data),
  login: (data) => api.post('/auth/login', data).then(r => r.data),
  logout: () => api.post('/auth/logout').then(r => r.data),
  me: () => api.get('/auth/me').then(r => r.data),
  refresh: () => api.post('/auth/refresh').then(r => r.data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }).then(r => r.data),
  resetPassword: (token, new_password) => api.post('/auth/reset-password', { token, new_password }).then(r => r.data),
};

export const categoriesApi = {
  list: () => api.get('/categories').then(r => r.data),
  create: (data) => api.post('/categories', data).then(r => r.data),
  delete: (id) => api.delete(`/categories/${id}`).then(r => r.data),
};

export const expensesApi = {
  list: (limit = 500) => api.get(`/expenses?limit=${limit}`).then(r => r.data),
  create: (data) => api.post('/expenses', data).then(r => r.data),
  update: (id, data) => api.put(`/expenses/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/expenses/${id}`).then(r => r.data),
};

export const budgetsApi = {
  list: (month) => {
    const params = month ? `?month=${month}` : '';
    return api.get(`/budgets${params}`).then(r => r.data);
  },
  create: (data) => api.post('/budgets', data).then(r => r.data),
  delete: (id) => api.delete(`/budgets/${id}`).then(r => r.data),
};

export const recurringApi = {
  list: () => api.get('/recurring-expenses').then(r => r.data),
  create: (data) => api.post('/recurring-expenses', data).then(r => r.data),
  update: (id, data) => api.put(`/recurring-expenses/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/recurring-expenses/${id}`).then(r => r.data),
  generate: () => api.post('/recurring-expenses/generate').then(r => r.data),
};

export const aiApi = {
  invokeLLM: (prompt, model) => api.post('/ai/invoke-llm', { prompt, model }).then(r => r.data.result),
};
