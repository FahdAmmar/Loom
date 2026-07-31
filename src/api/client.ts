import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

/**
 * Normalized shape every domain module throws on failure, so UI code
 * never has to branch on whether it received an AxiosError, a plain
 * Error, or something else.
 */
export class ApiError extends Error {
  status?: number;
  cause?: unknown;

  constructor(message: string, status?: number, cause?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.cause = cause;
  }
}

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "/api",
  timeout: 10_000,
  headers: { "Content-Type": "application/json" },
});

// Request interceptor — attach an auth token once real auth exists.
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem("loom-auth-token");
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});

// Response interceptor — unwrap `data` and normalize errors so callers
// never touch the raw Axios response/error shape.
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response?.status;
    const message =
      (error.response?.data as { message?: string } | undefined)?.message ??
      error.message ??
      "Something went wrong talking to the server.";
    return Promise.reject(new ApiError(message, status, error));
  },
);
