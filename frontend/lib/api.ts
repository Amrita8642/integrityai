import axios from "axios";
import Cookies from "js-cookie";

// Base URL setup
const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:8000";

const api = axios.create({
  baseURL: API_URL,
});

// Attach JWT token automatically
api.interceptors.request.use((config) => {
  const token = Cookies.get("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global error handler
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message =
      err.response?.data?.detail ||
      err.message ||
      "Something went wrong. Please try again.";
    return Promise.reject(new Error(message));
  }
);

export default api;

/* ======================
   Auth
====================== */

export const signUp = (data: {
  name: string;
  email: string;
  password: string;
  role: string;
}) => api.post("/api/auth/signup", data).then((r) => r.data);

export const login = (data: { email: string; password: string }) =>
  api.post("/api/auth/login", data).then((r) => r.data);

export const getMe = () =>
  api.get("/api/auth/me").then((r) => r.data);

/* ======================
   Assignments
====================== */

export const createAssignment = (title = "Untitled Assignment") =>
  api.post("/api/assignments/", { title }).then((r) => r.data);

export const listAssignments = () =>
  api.get("/api/assignments/").then((r) => r.data);

/* ======================
   Drafts
====================== */

export const createDraft = (data: {
  assignment_id: number;
  content: string;
  reflection_text?: string;
  language?: string;
}) => api.post("/api/drafts/", data).then((r) => r.data);

export const runIntegrityCheck = (draftId: number, language = "en") =>
  api
    .post(`/api/drafts/${draftId}/check?language=${language}`)
    .then((r) => r.data);

export const getDraftHistory = () =>
  api.get("/api/drafts/history/all").then((r) => r.data);

export const getDraft = (id: number) =>
  api.get(`/api/drafts/${id}`).then((r) => r.data);

/* ======================
   Files
====================== */

export const uploadFile = (
  draftId: number,
  file: File,
  onProgress?: (pct: number) => void
) => {
  const formData = new FormData();
  formData.append("file", file);

  return api
    .post(`/api/files/upload/${draftId}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (e) => {
        if (onProgress && e.total) {
          onProgress(Math.round((e.loaded * 100) / e.total));
        }
      },
    })
    .then((r) => r.data);
};

/* ======================
   Educator
====================== */

export const getSubmissions = () =>
  api.get("/api/educator/submissions").then((r) => r.data);

export const getStudents = () =>
  api.get("/api/educator/students").then((r) => r.data);

export const getPolicy = () =>
  api.get("/api/educator/policy").then((r) => r.data);

export const setPolicy = (data: {
  similarity_threshold: number;
  min_drafts: number;
}) =>
  api.post("/api/educator/policy", data).then((r) => r.data);