// frontend/src/app/api/proxy/route.ts  (app-router)
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  // Extract path from request url: we expect client to call /api/proxy/api/assetpart/...
  const url = new URL(req.url);
  const forwardPath = url.pathname.replace(/^\/api\/proxy/, ""); // keep trailing /api/assetpart/..
  const backend = process.env.BACKEND_INTERNAL_URL || "";

  const forwardUrl = backend + forwardPath;
  const body = await req.text();
  const headers = { ...Object.fromEntries(req.headers.entries()) };
  // remove host to avoid mismatch
  delete headers.host;

  const resp = await fetch(forwardUrl, {
    method: "POST",
    headers,
    body
  });

  const text = await resp.text();
  return new NextResponse(text, {
    status: resp.status,
    headers: { "content-type": resp.headers.get("content-type") || "application/json" },
  });
}
