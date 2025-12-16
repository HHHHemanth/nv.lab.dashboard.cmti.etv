"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { ShimmerButton } from "@/components/ui/shimmer-button";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

type Sample = {
  x: number;
  v: number;
  i: number;
  p: number;
};

export default function EnergyTimeDomainGraph() {
  const [dataRows, setDataRows] = useState<Sample[]>([]);
  const [plotting, setPlotting] = useState(false);

  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const espT0Ref = useRef<number | null>(null);
  const systemT0Ref = useRef<number | null>(null);

  const FASTAPI_URL = "/api/energy";

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
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  // ---------- CLEAR ----------
  const clearPlotting = () => {
    pausePlotting();
    setDataRows([]);
    espT0Ref.current = null;
    systemT0Ref.current = null;
  };

  // ---------- FETCH LOOP ----------
  useEffect(() => {
    if (!plotting) return;

    pollRef.current = setInterval(async () => {
      try {
        const resp = await fetch(FASTAPI_URL);
        if (!resp.ok) return;

        const json = await resp.json();

        const ts: number = json.timestamp_ms;
        const v: number = json.voltage_mV;
        const i: number = json.current_A;
        const p: number = json.power_VA;

        if (espT0Ref.current === null) {
          espT0Ref.current = ts;
          return;
        }

        if (systemT0Ref.current === null) return;

        const alignedTime =
          systemT0Ref.current + (ts - espT0Ref.current);

        setDataRows(prev => [
          ...prev,
          { x: alignedTime, v, i, p }
        ]);
      } catch (err) {
        console.error("FastAPI fetch error", err);
      }
    }, 100);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [plotting]);

  // ---------- PLOT ----------
  const plot = useMemo(() => {
    if (!dataRows.length) return null;

    return {
      data: [
        // Voltage
        {
          x: dataRows.map(p => p.x),
          y: dataRows.map(p => p.v),
          name: "Voltage (mV)",
          type: "scatter",
          mode: "lines",
          line: { width: 1.5, color: "#7df9ff" },
          hovertemplate:
            "%{x|%Y-%m-%d %H:%M:%S.%L}<br>Voltage: %{y} mV<extra></extra>"
        },

        // Current
        {
          x: dataRows.map(p => p.x),
          y: dataRows.map(p => p.i),
          name: "Current (A)",
          yaxis: "y2",
          type: "scatter",
          mode: "lines",
          line: { width: 1.2, color: "#ffffff", dash: "longdashdot"  },
          hovertemplate:
            "%{x|%Y-%m-%d %H:%M:%S.%L}<br>Current: %{y} A<extra></extra>"
        },

        // Power
        {
          x: dataRows.map(p => p.x),
          y: dataRows.map(p => p.p),
          name: "Power (VA)",
          yaxis: "y2",
          type: "scatter",
          mode: "lines",
          line: { width: 1.2, color: "#0030C2", dash: "dash" },
          hovertemplate:
            "%{x|%Y-%m-%d %H:%M:%S.%L}<br>Power: %{y} VA<extra></extra>"
        }
      ],
      layout: {
        title: "Voltage / Current / Power vs Time (ESP32)",
        margin: { l: 60, r: 60, t: 40, b: 80 },
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
          title: "Voltage (mV)",
          gridcolor: "rgba(185, 185, 185, 0.16)"
        },
        yaxis2: {
          overlaying: "y",
          showgrid: false,
          showticklabels: false,   // ← hides numbers
          title: "",               // ← hides title
          zeroline: false
        },
        legend: {
          orientation: "h",
          y: -2.0,        // move further down
          x: 0.5,
          xanchor: "center"
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
            Voltage / Current / Power (ESP32 → FastAPI)
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <ShimmerButton onClick={startPlotting} className="text-black text-base px-6 py-1 font-bold" background="#ffffffff">
            Start
          </ShimmerButton>

          <ShimmerButton onClick={pausePlotting} className="text-black text-base px-6 py-1 font-bold" background="#ffffffff">
            Pause
          </ShimmerButton>

          <ShimmerButton onClick={clearPlotting} className="text-black text-base px-6 py-1 font-bold" background="#ffffffff">
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
