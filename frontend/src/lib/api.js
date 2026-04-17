import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({ baseURL: API, timeout: 15000 });

export const getHalls = () => api.get("/halls").then((r) => r.data);
export const getSchools = () => api.get("/schools").then((r) => r.data);
export const getSchool = (id) => api.get(`/schools/${id}`).then((r) => r.data);

export const createStudent = (payload) =>
  api.post("/students", payload).then((r) => r.data);
export const getStudent = (id) =>
  api.get(`/students/${id}`).then((r) => r.data);
export const updateStudent = (id, payload) =>
  api.patch(`/students/${id}`, payload).then((r) => r.data);
export const getStamps = (id) =>
  api.get(`/students/${id}/stamps`).then((r) => r.data);
export const createStamp = (payload) =>
  api.post("/stamps", payload).then((r) => r.data);
export const deleteStamp = (id) =>
  api.delete(`/stamps/${id}`).then((r) => r.data);
export const getRecap = (id) =>
  api.get(`/students/${id}/recap`).then((r) => r.data);

export const createClass = (payload) =>
  api.post("/classes", payload).then((r) => r.data);
export const getClass = (code) =>
  api.get(`/classes/${code}`).then((r) => r.data);
export const getClassStudents = (code) =>
  api.get(`/classes/${code}/students`).then((r) => r.data);

export const getAnalytics = () =>
  api.get("/analytics/overview").then((r) => r.data);
