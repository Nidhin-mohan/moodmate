import { showToast } from "@/utils/toast";
import axios from "axios";

// Define the base URL from environment variables
const API_BASE_URL = "http://localhost:5000/api/v1";

// Create an Axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Enable cookies for authentication
});

// Add request interceptor (optional)
api.interceptors.request.use(
  (config) => {
    // Add headers or tokens here if needed
    const token = localStorage.getItem("authToken"); // Example: Add JWT token
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

// Add response interceptor (optional)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access (e.g., redirect to login)
      localStorage.removeItem("authToken");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
