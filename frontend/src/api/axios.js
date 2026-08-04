import axios from "axios";
import { getToken } from "../utils/authToken";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
  withCredentials: true, // sends the httpOnly JWT cookie as a fallback
  timeout: 20000, // never let a request hang forever — fail with a catchable error instead
  headers: { "Content-Type": "application/json" },
});

// Send this tab's own token, so multiple tabs in the same browser can be
// logged in as different users at once (the cookie alone can't do that,
// since it's shared across every tab).
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Central place to react to auth failures (e.g. redirect to login)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === "ECONNABORTED") {
      error.message = "The request took too long. Please check your connection and try again.";
    }
    return Promise.reject(error);
  }
);

export default api;
