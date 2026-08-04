import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
  withCredentials: true, // sends the httpOnly JWT cookie on every request
  timeout: 20000, // never let a request hang forever — fail with a catchable error instead
  headers: { "Content-Type": "application/json" },
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
