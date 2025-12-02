// src/lib/apiBase.ts
const raw = process.env.NEXT_PUBLIC_API_BASE ?? "";
export const API_BASE = raw.replace(/\/$/, "");
export const apiUrl = (path: string) =>
  `${API_BASE}${path.startsWith("/") ? "" : "/"}${path}`;
