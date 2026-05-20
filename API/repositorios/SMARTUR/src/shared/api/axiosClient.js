import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL;

export const api = axios.create({
  baseURL: API_BASE_URL,
});

// Interceptores de solicitud
api.interceptors.request.use(
  (config) => {
    // Verificar si hay un token en localStorage
    const token = localStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);
