"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { Select, InputNumber } from "antd";
import { apiUrl } from "@/lib/apiBase";
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function TimeDomainGraph({
  trigger, // object with { assetId, assetPartId, axis, dateTime, type } or null
  token // string
}: {
  trigger: { assetId: string; assetPartId: string; axis: string; dateTime: number; type: string } | null;
  token: string;
}) {
  const [dataRows, setDataRows] = useState<{ x: number; y: number }[] | null>(null);
  const [loading, setLoading] = useState(false);
  const plotRef = useRef<any>(null);

  async function fetchTimeSeries(payload: { assetId: string; assetPartId: string; axis: string; dateTime: number; type: string }) {
    setLoading(true);
    try {
      const resp = await fetch(apiUrl("/api/assetpart/timeseries"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token.replace(/^Bearer\s+/i, "")}`
        },
        body: JSON.stringify(trigger)
      });
      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(`${resp.status} ${text}`);
      }
      const json = await resp.json();
      // expected structure: { SR, twf_min, twf_max, Timeseries: [[t, val], ...] }
      const arr = (json.Timeseries || []).map((p: any) => ({ x: Number(p[0]), y: Number(p[1]) }));
      setDataRows(arr);
    } catch (err: any) {
      console.error(err);
      alert("Time series fetch failed: " + err.message);
    } finally { setLoading(false); }
  }

  useEffect(() => {
    async function doFetch() {
      if (!trigger) {
        console.log("[TimeDomainGraph] no trigger, skipping fetch");
        return;
      }
      if (!token) {
        console.warn("[TimeDomainGraph] missing token — cannot fetch");
        return;
      }


      const url = apiUrl("/api/assetpart/timeseries");
      console.log("[TimeDomainGraph] fetching", url, "payload:", trigger, "tokenPresent:", !!token);

      setLoading(true);
      try {
        const resp = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token.replace(/^Bearer\s+/i, "")}`,
          },
          body: JSON.stringify(trigger),
        });

        const text = await resp.text();
        console.log("[TimeDomainGraph] response status:", resp.status);
        console.log("[TimeDomainGraph] response preview:", text.slice(0, 2000));

        if (!resp.ok) {
          throw new Error(`Status ${resp.status}: ${text}`);
        }

        const json = JSON.parse(text);
        const times = (json.Timeseries || json.timeseries || json.data || []);
        const arr = times.map((p: any) => ({ x: Number(p[0]), y: Number(p[1]) }));
        setDataRows(arr);
      } catch (err: any) {
        console.error("[TimeDomainGraph] fetch error:", err);
      } finally {
        setLoading(false);
      }
    }

    doFetch();
  }, [trigger, token]);

  // map trigger.type -> axis title (x-axis)
  const getXAxisTitle = () => {
    const t = trigger?.type;
    if (t === "Velocity") return "Velocity";
    if (t === "Acceleration") return "Acceleration";
    if (t === "AccelerationEnvelope") return "Acceleration Envelope";
    return "Sample/Time";
  };

  const plot = useMemo(() => {
    if (!dataRows || dataRows.length === 0) return null;
    const xs = dataRows.map(p => p.x);
    const ys = dataRows.map(p => p.y);
    return {
      data: [
        {
          x: xs,
          y: ys,
          type: "scatter",
          mode: "lines",
          line: { width: 1, color: "#8FFF70" }, // neon green line
          hovertemplate: "%{x}<br>%{y}<extra></extra>"
        }
      ],
      layout: {
        title: "Time-domain waveform",
        margin: { l: 60, r: 30, t: 40, b: 80 },
        xaxis: {
          title: { text: getXAxisTitle(), font: { color: "#b4b4b4" } },
          // enable the small navigator / range slider under the plot
          rangeslider: {
            visible: xs && xs.length > 0,
            thickness: 0.08,
            bgcolor: "rgba(255,255,255,0.2)"
          },
          // if your x values are real timestamps (ms), consider:
          // type: "date"
          color: "#b4b4b4",
          gridcolor: "rgba(143,255,112,0.15)",
          zerolinecolor: "#b4b4b4ff",
        },
        yaxis: {
          title: { text: "Amplitude", font: { color: "#b4b4b4" } },
          automargin: true,
          color: "#b4b4b4",
          gridcolor: "rgba(143,255,112,0.12)",
          zerolinecolor: "rgba(143,255,112,0.18)",
        },
        paper_bgcolor: "transparent",
        plot_bgcolor: "transparent"
      },
      config: {
        responsive: true,
        displayModeBar: true,
        displaylogo: false,
        scrollZoom: true,
        showTips: false,
        modeBarButtonsToRemove: ["lasso2d", "select2d"],
      }
    };
  }, [dataRows, trigger?.type]);

  // futuristic card styles (copied from parameterGraph)
  const cardStyle: React.CSSProperties = {
    padding: 18,
    marginTop: 18,
    borderRadius: 14,
    background: "linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))",
    border: "1px solid rgba(120,180,255,0.06)",
    boxShadow: "0 8px 30px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.02)",
    color: "#dbeeff",
    backdropFilter: "blur(6px) saturate(120%)",
  };

  const plotWrapStyle: React.CSSProperties = {
    height: 420,
    borderRadius: 12,
    overflow: "hidden",
    background: "linear-gradient(180deg, rgba(10,10,10,0.8), rgba(6,6,6,0.9))",
    border: "1px solid rgba(255,255,255,0.03)",
    position: "relative"
  };

  const watermarkStyle: React.CSSProperties = {
    position: "absolute",
    right: 12,
    top: 12,
    fontSize: 12,
    color: "rgba(140,200,255,0.24)",
    background: "rgba(255,255,255,0.02)",
    padding: "6px 8px",
    borderRadius: 8,
    border: "1px solid rgba(255,255,255,0.02)",
    backdropFilter: "blur(4px)"
  };

  return (
    <div style={cardStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 16, color: "#ffffff" }}>Time Domain</div>
          <div style={{ color: "rgba(180,210,240,0.6)", fontSize: 13 }}>Will fetch when a point is selected in Parameter Trend</div>
        </div>
        <div>
          {loading ? <span>Loading...</span> : <span style={{ color: dataRows ? "rgba(255, 255, 255, 1)" : "rgba(200,200,200,0.5)" }}>{dataRows ? "Ready" : "No data"}</span>}
        </div>
      </div>

      <div style={plotWrapStyle}>
        <div style={watermarkStyle}>VIB • realtime</div>
        <div style={{ height: "100%" }}>
          {plot ? (
            <Plot
              data={plot.data as any}
              layout={plot.layout as any}
              config={plot.config as any}
              style={{ width: "100%", height: "100%" }}
              onInitialized={(_figure, gd) => { plotRef.current = gd; }}
              onUpdate={(_figure, gd) => { plotRef.current = gd; }}
            />
          ) : (
            <div style={{ padding: 28, color: "rgba(190,210,240,0.7)" }}>
              No time-domain data yet — select a point in Parameter Trend (and ensure JWT is provided).
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
