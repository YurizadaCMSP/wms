import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth API
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, newPassword: string) =>
    api.post('/auth/reset-password', { token, newPassword }),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.post('/auth/change-password', { currentPassword, newPassword }),
};

// Users API
export const usersAPI = {
  getAll: (params?: Record<string, string>) => api.get('/users', { params }),
  getById: (id: string) => api.get(`/users/${id}`),
  create: (data: Record<string, unknown>) => api.post('/users', data),
  update: (id: string, data: Record<string, unknown>) =>
    api.put(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
  resetPassword: (id: string) =>
    api.post(`/users/${id}/reset-password`),
};

// Products API
export const productsAPI = {
  getAll: (params?: Record<string, string>) =>
    api.get('/products', { params }),
  getById: (id: string) => api.get(`/products/${id}`),
  create: (data: Record<string, unknown>) => api.post('/products', data),
  update: (id: string, data: Record<string, unknown>) =>
    api.put(`/products/${id}`, data),
  delete: (id: string) => api.delete(`/products/${id}`),
  getCategories: () => api.get('/products/categories'),
  getLowStock: () => api.get('/products/low-stock'),
  getOutOfStock: () => api.get('/products/out-of-stock'),
};

// Loans API
export const loansAPI = {
  getAll: (params?: Record<string, string>) =>
    api.get('/loans', { params }),
  getActive: () => api.get('/loans/active'),
  getById: (id: string) => api.get(`/loans/${id}`),
  create: (data: Record<string, unknown>) => api.post('/loans', data),
};

// Returns API
export const returnsAPI = {
  getAll: (params?: Record<string, string>) =>
    api.get('/returns', { params }),
  create: (data: Record<string, unknown>) => api.post('/returns', data),
};

// Occurrences API
export const occurrencesAPI = {
  getAll: (params?: Record<string, string>) =>
    api.get('/occurrences', { params }),
  create: (data: Record<string, unknown>) =>
    api.post('/occurrences', data),
  acknowledge: (id: string) =>
    api.put(`/occurrences/${id}/acknowledge`),
};

// Dashboard API
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getRecentActivity: () => api.get('/dashboard/recent-activity'),
  getCharts: () => api.get('/dashboard/charts'),
  getRecentLoans: () => api.get('/dashboard/recent-loans'),
  getRecentReturns: () => api.get('/dashboard/recent-returns'),
};

// Logs API
export const logsAPI = {
  getAll: (params?: Record<string, string>) =>
    api.get('/logs', { params }),
};

// Reports API
export const reportsAPI = {
  generate: (type: string, params?: Record<string, string>) =>
    api.get(`/reports/${type}`, { params }),
};
