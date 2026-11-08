import { showToast } from "@/utils/toast";
import axios, { AxiosError } from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api/v1";

// Create an Axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Enable cookies for authentication
});

// Attach the token from localStorage (not React state, to avoid stale closures).
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    showToast.error("Request error");
    return Promise.reject(error);
  }
);

// A 401 on these means "bad credentials", not "session expired": let the form handle it.
const CREDENTIAL_ENDPOINTS = ["/auth/login", "/auth/register"];

// 401 → session is gone: clear it and hard-redirect to /login.
// 403 → logged in but not allowed: leave the session alone; the caller shows the error.
export const onResponseError = (error: AxiosError) => {
  const url = error.config?.url ?? "";
  const isCredentialCall = CREDENTIAL_ENDPOINTS.some((p) => url.endsWith(p));

  if (error.response?.status === 401 && !isCredentialCall) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.assign("/login");
  }
  return Promise.reject(error);
};

api.interceptors.response.use((response) => response, onResponseError);

export default api;
