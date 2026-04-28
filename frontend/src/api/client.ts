import axios from "axios";

export const api = axios.create({ baseURL: "" });

export const FILES = {
  list: () => api.get("/api/files").then((r) => r.data),
  get: (id: number) => api.get(`/api/files/${id}`).then((r) => r.data),
  upload: (form: FormData) =>
    api
      .post("/api/files/upload", form, { headers: { "Content-Type": "multipart/form-data" } })
      .then((r) => r.data),
  delete: (id: number) => api.delete(`/api/files/${id}`).then((r) => r.data),
  updateGroundTruth: (id: number, ground_truth: string) =>
    api.put(`/api/files/${id}/ground-truth`, { ground_truth }).then((r) => r.data),
  audioUrl: (id: number) => `/api/files/${id}/audio`,
};

export const TRANSCRIPTIONS = {
  run: (file_ids: number[], models: string[]) =>
    api.post("/api/transcriptions/run", { file_ids, models }).then((r) => r.data),
  get: (id: number) => api.get(`/api/transcriptions/${id}`).then((r) => r.data),
  forFile: (fileId: number) =>
    api.get(`/api/transcriptions/file/${fileId}`).then((r) => r.data),
  diff: (id: number) => api.get(`/api/transcriptions/${id}/diff`).then((r) => r.data),
  recalculate: (id: number) =>
    api.put(`/api/transcriptions/${id}/recalculate`).then((r) => r.data),
  models: () => api.get("/api/transcriptions/models").then((r) => r.data),
  trend: () => api.get("/api/transcriptions/history/trend").then((r) => r.data),
};

export const BENCHMARKS = {
  create: (name: string, file_ids: number[], models: string[]) =>
    api.post("/api/benchmarks", { name, file_ids, models }).then((r) => r.data),
  list: () => api.get("/api/benchmarks").then((r) => r.data),
  get: (id: number) => api.get(`/api/benchmarks/${id}`).then((r) => r.data),
  summary: (id: number) => api.get(`/api/benchmarks/${id}/summary`).then((r) => r.data),
  exportCsv: (id: number) => `/api/exports/${id}/csv`,
  exportJson: (id: number) => `/api/exports/${id}/json`,
};

export const STATS = {
  get: () => api.get("/api/stats").then((r) => r.data),
};
