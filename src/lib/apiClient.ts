// frontend/src/lib/apiClient.ts
export type ParamTrendsReq = {
  assetId: string;
  assetPartId: string;
  axis: string;
  days?: number;
  type?: string; // parameter name
};

export type TimeSeriesReq = {
  assetId: string;
  assetPartId: string;
  axis: string;
  dateTime: number; // unix ms
  type: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || ""; // must be set in .env.local

async function request<T = any>(path: string, token?: string, body?: any, method = "POST") {
  const url = API_BASE.replace(/\/$/, "") + path;
  const headers: Record<string,string> = {
    "Content-Type": "application/json",
  };
  if (token) headers["Authorization"] = (token.startsWith("Bearer ") ? token : `Bearer ${token}`);
  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(()=>null);
    throw new Error(`API error ${res.status} ${text ?? ""}`);
  }
  return (await res.json()) as T;
}

export async function postParameterTrends(payload: ParamTrendsReq, token?: string) {
  return request("/api/assetpart/ParameterTrends", token, payload);
}

export async function postTimeSeries(payload: TimeSeriesReq, token?: string) {
  return request("/api/assetpart/timeseries", token, payload);
}

export async function postFFT(payload: TimeSeriesReq, token?: string) {
  return request("/api/assetpart/fft", token, payload);
}
