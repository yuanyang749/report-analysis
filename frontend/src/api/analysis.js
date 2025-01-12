import axios from "axios";

const api = axios.create({
  baseURL: process.env.VUE_APP_API_URL || "http://localhost:3001",
  timeout: 600000,
});

export function analyzeReport(data) {
  return api.post("/api/analyze", data);
}
