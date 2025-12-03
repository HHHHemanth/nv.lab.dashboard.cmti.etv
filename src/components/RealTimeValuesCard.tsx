// ./components/RealTimeValuesCard.tsx
"use client";

import React, { useEffect, useState } from "react";
import { apiUrl } from "@/lib/apiBase";
import MagicBento, { BentoCardProps } from "./MagicBento";
// Make TypeScript happy by defining sensors first




type Metric = {
  value: number;
  status: string;
};

type AxisData = {
  Velocity: Metric;
  Acceleration: Metric;
  ["Acceleration Envelope"]: Metric;
  Temperature: Metric;
};

type SensorData = {
  H: AxisData;
  V: AxisData;
  A: AxisData;
  sensorName: string;
  Date: string;
};

type RealTimeResponse = Record<string, SensorData>;

function statusColor(status?: string) {
  const s = (status || "").toLowerCase();
  if (s === "normal") return "text-emerald-400"; // green
  if (s === "warning") return "text-amber-400"; // yellow/orange
  if (s === "unacceptable") return "text-red-500"; // red
  return "text-slate-300"; // default
}

function formatDateToIST(gmtString: string) {
  const d = new Date(gmtString);
  if (Number.isNaN(d.getTime())) return gmtString;

  return d.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function RealTimeValuesCard({ assetId }: { assetId: string }) {
  const [data, setData] = useState<RealTimeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchRealtime() {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch(
        apiUrl(`/realtime?assetId=${encodeURIComponent(assetId)}`)
      );
      const text = await resp.text();
      if (!resp.ok) {
        throw new Error(`Status ${resp.status}: ${text}`);
      }
      const json: RealTimeResponse = JSON.parse(text);
      setData(json);
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? "Failed to load realtime data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRealtime();
  }, [assetId]);

  const sensors = data ? Object.values(data) : [];
  // Build MagicBento cards from backend sensors
const cards: BentoCardProps[] = sensors.map((sensor) => {
  const velH = sensor.H.Velocity.value.toFixed(2);
  const velV = sensor.V.Velocity.value.toFixed(2);
  const velA = sensor.A.Velocity.value.toFixed(2);

  const accH = sensor.H.Acceleration.value.toFixed(2);
  const accV = sensor.V.Acceleration.value.toFixed(2);
  const accA = sensor.A.Acceleration.value.toFixed(2);

  const envH = sensor.H["Acceleration Envelope"].value.toFixed(2);
  const envV = sensor.V["Acceleration Envelope"].value.toFixed(2);
  const envA = sensor.A["Acceleration Envelope"].value.toFixed(2);

  const tempH = sensor.H.Temperature.value.toFixed(2);
  const tempV = sensor.V.Temperature.value.toFixed(2);
  const tempA = sensor.A.Temperature.value.toFixed(2);

  return {
    color: "#0a0a0a",
    label: sensor.sensorName,
    title: formatDateToIST(sensor.Date),
 description: (
  <table className="text-left text-sm mt-3 mx-5">
    <tbody>
      <tr>
        <th className="pr-3 text-sm">Velocity</th>
        <td>H:{velH}</td>
        <td className="pl-3">V:{velV}</td>
        <td className="pl-3">A:{velA}</td>
      </tr>
      <tr>
        <th className="pr-3 text-sm">Acceleration</th>
        <td>H:{accH}</td>
        <td className="pl-3">V:{accV}</td>
        <td className="pl-3">A:{accA}</td>
      </tr>
      <tr>
        <th className="pr-3 text-sm">Acceleration Env</th>
        <td>H:{envH}</td>
        <td className="pl-3">V:{envV}</td>
        <td className="pl-3">A:{envA}</td>
      </tr>
      <tr>
        <th className="pr-3 text-sm">Temperature</th>
        <td>H:{tempH}</td>
        <td className="pl-3">V:{tempV}</td>
        <td className="pl-3">A:{tempA}</td>
      </tr>
    </tbody>
  </table>
),

  };
});



  // mini dark card used inside each sensor card
  const MetricBlock = ({
    title,
    H,
    V,
    A,
  }: {
    title: string;
    H: Metric;
    V: Metric;
    A: Metric;
  }) => (
    <div className="bg-gradient-to-br from-[#0a341c] to-[#0f4420] text-lg text-slate-100 rounded-md border border-green-700/40 shadow-md min-w-[160px]">

      <div className="px-4 py-2  text-[11px] font-semibold tracking-wide uppercase text-slate-300">
        {title}
      </div>
      <div className="px-4 py-3 space-y-1">
        <div className={`${statusColor(H.status)} font-semibold`}>
          H: {H.value.toFixed(2)}
        </div>
        <div className={`${statusColor(V.status)} font-semibold`}>
          V: {V.value.toFixed(2)}
        </div>
        <div className={`${statusColor(A.status)} font-semibold`}>
          A: {A.value.toFixed(2)}
        </div>
      </div>
    </div>
  );

   return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">

        <h3 className="text-4xl  font-semibold text-slate-100">
          Summary
        </h3>
        <button
          onClick={fetchRealtime}
          disabled={loading}
          className="rounded-full bg-black text-black px-4 py-2 text-xs font-semibold text-white shadow-md active:scale-95 disabled:opacity-60"
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="mb-3 text-xs text-red-400 bg-red-500/10 border border-red-500/40 rounded-md px-3 py-2">
          {error}
        </div>
      )}

      {/* 🔹 render all sensors as MagicBento cards */}
      {sensors.length === 0 && !loading ? (
        <div className="px-4 py-6 text-center text-xs text-slate-400">
          No realtime data yet.
        </div>
      ) : (
        <MagicBento
        textAutoHide={true}
        enableStars={true}
        enableSpotlight={true}
        enableBorderGlow={true}
        enableTilt={true}
        enableMagnetism={true}
        clickEffect={true}
        spotlightRadius={300}
        particleCount={12}
        glowColor="143, 255, 112"
          cards={cards}
        />
      )}
    </div>
  );
}

