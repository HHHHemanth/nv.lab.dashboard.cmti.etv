// src/lib/apiBase.ts
export const API_BASE = (process.env.NEXT_PUBLIC_API_BASE || "").replace(/\/$/, "");
export const apiUrl = (path: string) => `${API_BASE}${path.startsWith("/") ? "" : "/"}${path}`;
