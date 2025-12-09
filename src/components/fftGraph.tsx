"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });
import { apiUrl } from "@/lib/apiBase";
export default function FFTGraph({
  trigger,
  token
}: {
  trigger: { assetId: string; assetPartId: string; axis: string; dateTime: number; type: string } | null;
  token: string;
}) {
  const [fftData, setFftData] = useState<{ freq: number; value: number }[] | null>(null);
  const [loading, setLoading] = useState(false);
  const graphDivRef = useRef<any>(null);

  async function fetchFFT(payload: { assetId: string; assetPartId: string; axis: string; dateTime: number; type: string }) {
    setLoading(true);
    try {
      const resp = await fetch("/api/assetpart/fft", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token.replace(/^Bearer\s+/i, "")}`
        },
        body: JSON.stringify(payload)
      });
      if (!resp.ok) {
        const t = await resp.text();
        throw new Error(t || `status ${resp.status}`);
      }
      const json = await resp.json();
      // expected: { SR, fft_min, fft_max, FFT: [ [f, v], ... ] }
      const arr = (json.FFT || []).map((p: any) => ({ freq: Number(p[0]), value: Number(p[1]) }));
      setFftData(arr);
    } catch (err: any) {
      console.error(err);
      alert("FFT fetch failed: " + err.message);
    } finally { setLoading(false); }
  }

  useEffect(() => {
    async function doFetch() {
      if (!trigger) {
        // nothing to do
        return;
      }
      if (!token) {
        console.warn("[FFTGraph] missing token — cannot fetch");
        return;
      }

 
      const url = apiUrl("/api/assetpart/fft");
      console.log("[FFTGraph] fetching", url, "payload:", trigger, "tokenPresent:", !!token);
      setLoading(true);
      try {
        const resp = await fetch(apiUrl("/api/assetpart/fft"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token.replace(/^Bearer\s+/i, "")}`
          },
          body: JSON.stringify(trigger)
        });


        const text = await resp.text();
        if (!resp.ok) {
          throw new Error(`Status ${resp.status}: ${text}`);
        }

        const json = JSON.parse(text);
        const fft = (json.FFT || json.fft || json.data || []);
        const arr = fft.map((p: any) => ({ freq: Number(p[0]), value: Number(p[1]) }));
        setFftData(arr);
      } catch (err: any) {
        console.error("[FFTGraph] fetch failed:", err);
      } finally {
        setLoading(false);
      }
    }

    doFetch();
  }, [trigger, token]);

  // Plot creation — styled to match TimeDomainGraph UI
  const plot = useMemo(() => {
    if (!fftData || fftData.length === 0) return null;
    const x = fftData.map(p => p.freq);
    const y = fftData.map(p => p.value);
    return {
      data: [
        {
          x,
          y,
          type: "bar",
          marker: { color: "#8FFF70", line: { width: 0 } },
          hovertemplate: "%{x} Hz<br>%{y}<extra></extra>"
        }
      ],
      layout: {
        title: "FFT",
        margin: { l: 60, r: 30, t: 40, b: 80 },
        xaxis: {
          title: { text: "Frequency", font: { color: "#b4b4b4" } }, // fixed label
          rangeslider: {
            visible: x && x.length > 0,
            thickness: 0.08,
            bgcolor: "rgba(255,255,255,0.2)"
          },
          color: "#b4b4b4",
          gridcolor: "rgba(143,255,112,0.15)",
          zerolinecolor: "rgba(143,255,112,0.18)"
        },
        yaxis: {
          title: { text: "Amplitude", font: { color: "#b4b4b4" } }, // fixed label
          automargin: true,
          color: "#b4b4b4",
          gridcolor: "rgba(143,255,112,0.12)",
          zerolinecolor: "rgba(143,255,112,0.18)"
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
  }, [fftData]);

  // visual styles (match TimeDomainGraph)
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
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 16, color: "#e6f7ff" }}>FFT</div>
          <div style={{ color: "rgba(190,210,240,0.7)", fontSize: 13 }}>Frequency-domain computed for selected timestamp</div>
        </div>
        <div>{loading ? "Loading..." : (fftData ? "Ready" : "No data")}</div>
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
              onInitialized={(_, graphDiv) => { graphDivRef.current = graphDiv; }}
              onUpdate={(_, graphDiv) => { graphDivRef.current = graphDiv; }}
            />
          ) : (
            <div style={{ padding: 28, color: "rgba(190,210,240,0.7)" }}>No FFT yet — select a timestamp in Parameter Trend.</div>
          )}
        </div>
      </div>
    </div>
  );
}
