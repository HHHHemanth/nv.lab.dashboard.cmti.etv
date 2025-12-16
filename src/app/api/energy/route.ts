import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const backend = process.env.ENERGY_BACKEND_URL!;
  const resp = await fetch(`${backend}/latest`);
  const data = await resp.text();

  return new NextResponse(data, {
    status: resp.status,
    headers: { "content-type": "application/json" },
  });
}

