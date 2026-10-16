import axios from "axios";

export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

export const AUTH_API_URL =
  `${API_BASE_URL}/auth`;

export const USER_API_URL =
  `${API_BASE_URL}/user`;

export const PAYMENT_API_URL =
  `${API_BASE_URL}/payments`;

export const PRODUCT_API_URL =
  `${API_BASE_URL}/products`;

export const WISHLIST_API_URL =
  `${API_BASE_URL}/wishlist`;

export const NOTIFICATION_API_URL =
  `${API_BASE_URL}/notifications`;

export const ADMIN_API_URL =
  `${API_BASE_URL}/admin`;

export const DELIVERY_API_URL =
  `${API_BASE_URL}/delivery`;

export const SYSTEM_API_URL =
  `${API_BASE_URL}/system`;

export const ORDER_API_URL =
  `${API_BASE_URL}/orders`;

// =====================================================
// GLOBAL AXIOS REQUEST INTERCEPTOR
// Automatically attach Bearer token if present
// =====================================================
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// =====================================================
// GLOBAL AXIOS RESPONSE INTERCEPTOR
// Automatically clear session and redirect to /login on 401
// =====================================================
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const hasToken = Boolean(localStorage.getItem("token"));
      const isProtectedRoute =
        window.location.pathname.startsWith("/admin") ||
        window.location.pathname.startsWith("/client") ||
        window.location.pathname.startsWith("/delivery");

      if (hasToken) {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        localStorage.removeItem("user");
      }

      if (hasToken && isProtectedRoute) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);