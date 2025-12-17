"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { Select } from "antd";

const RATE_OPTIONS = [
  { label: "10 Hz", value: 10 },
  { label: "50 Hz", value: 50 },
  { label: "100 Hz", value: 100 },
  { label: "500 Hz", value: 500 }
];

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

type Sample = {
  x: number;   // aligned timestamp (ms)
  i: number;   // current (A)
};

export default function EnergyTimeDomainGraph() {
  const [dataRows, setDataRows] = useState<Sample[]>([]);
  const [plotting, setPlotting] = useState(false);
  const [rate, setRate] = useState<number>(50); // 🔹 DEFAULT RATE

  const espT0Ref = useRef<number | null>(null);
  const systemT0Ref = useRef<number | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // ---------- START ----------
  const startPlotting = () => {
    if (plotting) return;
    espT0Ref.current = null;
    systemT0Ref.current = Date.now();
    setPlotting(true);
  };

  // ---------- PAUSE ----------
  const pausePlotting = () => {
    setPlotting(false);
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  };

  // ---------- CLEAR ----------
  const clearPlotting = () => {
    pausePlotting();
    setDataRows([]);
    espT0Ref.current = null;
    systemT0Ref.current = null;
  };

  // ---------- WEBSOCKET LOOP ----------
  useEffect(() => {
    if (!plotting) return;

    const ws = new WebSocket("ws://192.168.4.10:8000/ws");
    wsRef.current = ws;

    ws.onopen = () => {
      // 🔹 send selected rate to backend
      ws.send(JSON.stringify({ rate }));
    };

    ws.onmessage = (event) => {
      const json = JSON.parse(event.data);

      const samples = json.samples;
      if (!Array.isArray(samples)) return;

      setDataRows(prev => {
        const newRows = [...prev];

        for (const s of samples) {
          const t_us = s.t_us;
          const i = s.i;

          if (espT0Ref.current === null) {
            espT0Ref.current = t_us;
            continue;
          }

          if (systemT0Ref.current === null) continue;

          const alignedTime =
            systemT0Ref.current + (t_us - espT0Ref.current) / 1000.0;

          const lastX = newRows.length
            ? newRows[newRows.length - 1].x
            : null;

          if (lastX === null || alignedTime > lastX) {
            newRows.push({ x: alignedTime, i });
          }

        }

        return newRows;
      });
    };

    ws.onerror = (err) => {
      console.error("WebSocket error", err);
    };

    return () => {
      ws.close();
    };
  }, [plotting, rate]);

  // ---------- PLOT ----------
  const plot = useMemo(() => {
    if (!dataRows.length) return null;

    return {
      data: [
        {
          x: dataRows.map(p => p.x),
          y: dataRows.map(p => p.i),
          name: "Current (A)",
          type: "scatter",
          mode: "lines",
          line: { width: 1.5, color: "#7df9ff" },
          hovertemplate:
            "%{x|%Y-%m-%d %H:%M:%S.%L}<br>Current: %{y} A<extra></extra>"
        }
      ],
      layout: {
        title: "Current vs Time (ESP32)",
        margin: { l: 60, r: 30, t: 40, b: 80 },
        xaxis: {
          title: "Time",
          type: "date",
          tickformat: "%Y-%m-%d %H:%M:%S.%L",
          hoverformat: "%Y-%m-%d %H:%M:%S.%L",
          tickangle: -45,
          rangeslider: { visible: true, thickness: 0.08 },
          gridcolor: "rgba(185, 185, 185, 0.16)"
        },
        yaxis: {
          title: "Current (A)",
          gridcolor: "rgba(185, 185, 185, 0.16)"
        },
        paper_bgcolor: "transparent",
        plot_bgcolor: "transparent"
      },
      config: {
        responsive: true,
        scrollZoom: true,
        displayModeBar: true,
        displaylogo: false
      }
    };
  }, [dataRows]);

  // ---------- UI ----------
  return (
    <div style={{
      padding: 18,
      borderRadius: 14,
      background: "rgba(10,10,10,0.8)",
      border: "1px solid rgba(255,255,255,0.08)"
    }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        marginBottom: 10
      }}>
        <div>
          <div style={{ fontWeight: 700 }}>Time Domain</div>
          <div style={{ fontSize: 13, opacity: 0.7 }}>
            Current vs Time (ESP32 → FastAPI)
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {/* 🔹 RATE DROPDOWN */}
<Select
  value={rate}
  onChange={(v) => setRate(v)}
  options={RATE_OPTIONS}
  placeholder="Sample Rate"
  className="futuristic-select"
  style={{ width: 140 }}
/>
          <ShimmerButton onClick={startPlotting} className="text-black text-base px-6 py-1 font-bold" shimmerColor="rgba(0, 0, 0, 1)" background="#ffffffff" >
            Start
          </ShimmerButton>

          <ShimmerButton onClick={pausePlotting} className="text-black text-base px-6 py-1 font-bold" shimmerColor="rgba(0, 0, 0, 1)" background="#ffffffff" >
            Pause
          </ShimmerButton>

          <ShimmerButton onClick={clearPlotting} className="text-black text-base px-6 py-1 font-bold" shimmerColor="rgba(0, 0, 0, 1)" background="#ffffffff" >
            Clear
          </ShimmerButton>
        </div>
      </div>

      <div style={{
        height: 420,
        borderRadius: 10,
        overflow: "hidden",
        background: "#050505"
      }}>
        {plot ? (
          <Plot
            data={plot.data as any}
            layout={plot.layout as any}
            config={plot.config as any}
            style={{ width: "100%", height: "100%" }}
          />
        ) : (
          <div style={{ padding: 30, opacity: 0.6 }}>
            Click <b>Start</b> to begin plotting
          </div>
        )}
      </div>
    </div>
  );
}
