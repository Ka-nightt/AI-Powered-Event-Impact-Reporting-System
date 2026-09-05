import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";

const client = axios.create({ baseURL: API_BASE });

client.interceptors.request.use((config) => {
  const token = localStorage.getItem("eir_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("eir_token");
      localStorage.removeItem("eir_user");
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  },
);

// Auth
export const registerUser = (payload) =>
  client.post("/auth/register", payload).then((r) => r.data);
export const loginUser = (payload) =>
  client.post("/auth/login", payload).then((r) => r.data);
export const getMe = () => client.get("/auth/me").then((r) => r.data);

// Events
export const getEvents = (search) =>
  client
    .get("/events", { params: search ? { search } : {} })
    .then((r) => r.data);
export const getEvent = (id) => client.get(`/events/${id}`).then((r) => r.data);
export const createEvent = (payload) =>
  client.post("/events", payload).then((r) => r.data);
export const updateEvent = (id, payload) =>
  client.put(`/events/${id}`, payload).then((r) => r.data);
export const deleteEvent = (id) =>
  client.delete(`/events/${id}`).then((r) => r.data);

// SDGs
export const getSdgGoals = () => client.get("/sdg").then((r) => r.data);

// Uploads - two-step validate-then-confirm flow
export const previewAttendance = (eventId, file) => {
  const form = new FormData();
  form.append("file", file);
  return client
    .post(`/uploads/${eventId}/attendance/preview`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data);
};
export const confirmAttendance = (eventId, tempFile, originalName) =>
  client
    .post(`/uploads/${eventId}/attendance/confirm`, { tempFile, originalName })
    .then((r) => r.data);

export const previewSurvey = (eventId, file) => {
  const form = new FormData();
  form.append("file", file);
  return client
    .post(`/uploads/${eventId}/survey/preview`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data);
};
export const confirmSurvey = (eventId, tempFile, originalName) =>
  client
    .post(`/uploads/${eventId}/survey/confirm`, { tempFile, originalName })
    .then((r) => r.data);

export const getUploads = (eventId) =>
  client.get(`/uploads/${eventId}`).then((r) => r.data);

// Analytics
export const getDashboardStats = () =>
  client.get("/analytics/dashboard").then((r) => r.data);
export const getAttendanceTrend = () =>
  client.get("/analytics/trend").then((r) => r.data);
export const getEventAnalytics = (eventId) =>
  client.get(`/analytics/${eventId}`).then((r) => r.data);

// Reports
export const generateReport = (eventId) =>
  client.post(`/reports/${eventId}/generate`).then((r) => r.data);
export const getReports = (eventId) =>
  client.get(`/reports/${eventId}`).then((r) => r.data);

/**
 * Downloads a report PDF through an authenticated request (the endpoint
 * requires a Bearer token, so a plain <a href> link can't be used) and
 * triggers a normal browser save via a temporary blob URL.
 */
export const downloadReportFile = async (
  id,
  filename = "event-impact-report.pdf",
) => {
  const res = await client.get(`/reports/download/${id}`, {
    responseType: "blob",
  });
  const url = window.URL.createObjectURL(
    new Blob([res.data], { type: "application/pdf" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

// Gallery
export const uploadPhotos = (eventId, files, captions = []) => {
  const form = new FormData();
  Array.from(files).forEach((f) => form.append("photos", f));
  captions.forEach((c) => form.append("captions", c));
  return client
    .post(`/gallery/${eventId}`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data);
};
export const getPhotos = (eventId) =>
  client.get(`/gallery/${eventId}`).then((r) => r.data);
export const deletePhoto = (id) =>
  client.delete(`/gallery/photo/${id}`).then((r) => r.data);

export const API_ORIGIN = API_BASE.replace(/\/api$/, "");

export default client;
