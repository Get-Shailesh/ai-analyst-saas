import axios, { AxiosInstance, AxiosRequestConfig } from "axios";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

// ── Axios instance ────────────────────────────────────────────────────────────
export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

// ── Request interceptor — attach JWT ──────────────────────────────────────────
apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("auth_token");
    const storeData = localStorage.getItem("ai-analyst-store");
    let finalToken = token;
    if (!finalToken && storeData) {
      try {
        const parsed = JSON.parse(storeData);
        finalToken = parsed?.state?.token;
      } catch (e) {}
    }
    if (finalToken) config.headers.Authorization = `Bearer ${finalToken}`;
  }
  return config;
});

// ── Response interceptor — handle 401 ────────────────────────────────────────
apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("auth_token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  },
);

// ── Auth API ──────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post("/auth/login", { email, password }),
  register: (email: string, password: string, name: string) =>
    apiClient.post("/auth/register", { email, password, name }),
  me: () => apiClient.get("/auth/me"),
  refresh: () => apiClient.post("/auth/refresh"),
};

// ── Dataset API ───────────────────────────────────────────────────────────────
export const datasetApi = {
  upload: (file: File, onProgress?: (pct: number) => void) => {
    const form = new FormData();
    form.append("file", file);
    return apiClient.post("/datasets/upload", form, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (e) => {
        if (onProgress && e.total)
          onProgress(Math.round((e.loaded / e.total) * 100));
      },
    });
  },
  list: () => apiClient.get("/datasets"),
  get: (id: string) => apiClient.get(`/datasets/${id}`),
  profile: (id: string) => apiClient.get(`/datasets/${id}/profile`),
  preview: (id: string, rows = 50) =>
    apiClient.get(`/datasets/${id}/preview?rows=${rows}`),
  delete: (id: string) => apiClient.delete(`/datasets/${id}`),
};

// ── Analysis API ──────────────────────────────────────────────────────────────
export const analysisApi = {
  run: (payload: unknown) => apiClient.post("/analysis/run", payload),
  status: (id: string) => apiClient.get(`/analysis/${id}/status`),
  get: (id: string) => apiClient.get(`/analysis/${id}`),
  list: (datasetId: string) =>
    apiClient.get(`/analysis?dataset_id=${datasetId}`),
  charts: (id: string) => apiClient.get(`/analysis/${id}/charts`),
  kpis: (id: string) => apiClient.get(`/analysis/${id}/kpis`),
  insights: (id: string) => apiClient.get(`/analysis/${id}/insights`),
};

// ── Chat API ──────────────────────────────────────────────────────────────────
export const chatApi = {
  send: (datasetId: string, message: string, history: unknown[]) =>
    apiClient.post("/chat/message", {
      dataset_id: datasetId,
      message,
      history,
    }),
  history: (datasetId: string) => apiClient.get(`/chat/history/${datasetId}`),
};

// ── SQL Generator API ─────────────────────────────────────────────────────────
export const sqlApi = {
  generate: (datasetId: string, question: string) =>
    apiClient.post("/sql/generate", { dataset_id: datasetId, question }),
  execute: (datasetId: string, sql: string) =>
    apiClient.post("/sql/execute", { dataset_id: datasetId, sql }),
};

// ── Report API ────────────────────────────────────────────────────────────────
export const reportApi = {
  generate: (analysisId: string, format: string) =>
    apiClient.post("/reports/generate", { analysis_id: analysisId, format }),
  status: (reportId: string) => apiClient.get(`/reports/${reportId}/status`),
  download: (reportId: string) =>
    apiClient.get(`/reports/${reportId}/download`, { responseType: "blob" }),
};

export const datasetsApi = {
  upload: (file: File, problemStatement: string) => {
    const form = new FormData();
    form.append("file", file);
    form.append("problem_statement", problemStatement);
    return apiClient.post("/datasets/upload", form);
  },
  list: () => apiClient.get("/datasets"),
  getProfile: (id: string) => apiClient.get(`/datasets/${id}/profile`),
  getPreview: (id: string) => apiClient.get(`/datasets/${id}/preview`),
  delete: (id: string) => apiClient.delete(`/datasets/${id}`),
};
