"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { ShimmerButton } from "@/components/ui/shimmer-button";
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });
import { apiUrl } from "@/lib/apiBase";
export default function EnergyFFTGraph() {
  const fftWsRef = useRef<WebSocket | null>(null);
  const [trigger, setTrigger] = useState<any>(null);
  const [fftData, setFftData] = useState<{ freq: number; value: number }[] | null>(null);
  const [loading, setLoading] = useState(false);
  const graphDivRef = useRef<any>(null);
  // UI + analysis controls
const [unit, setUnit] = useState<"HZ" | "CPM">("HZ");

const [minFreq, setMinFreq] = useState<number | null>(0);
const [maxFreq, setMaxFreq] = useState<number | null>(0);

const [harmonicsOn, setHarmonicsOn] = useState<boolean>(true);
const [harmonicFreq, setHarmonicFreq] = useState<number>(0);
const [harmonicCount, setHarmonicCount] = useState<number>(0);

const [sidebandsOn, setSidebandsOn] = useState<boolean>(true);
const [sidebandFreq, setSidebandFreq] = useState<number>(0);
const [sidebandCount, setSidebandCount] = useState<number>(0);



useEffect(() => {
  if (!trigger) return;

  setLoading(true);

  // ⚠️ Update IP/host if needed
  const wsUrl = "ws://192.168.4.10:8000/fft-ws";
  const ws = new WebSocket(wsUrl);
  fftWsRef.current = ws;

  ws.onopen = () => {
    console.log("✅ FFT WS connected");
  };

  ws.onmessage = (ev) => {
    try {
      const msg = JSON.parse(ev.data);
      /**
       * Expected from backend:
       * {
       *   fs: number,
       *   freq: number[],
       *   mag: number[]
       * }
       */
      if (Array.isArray(msg.freq) && Array.isArray(msg.mag)) {
        const arr = msg.freq.map((f: number, i: number) => ({
          freq: f,
          value: msg.mag[i] ?? 0
        }));
        setFftData(arr);
        setLoading(false);
      }
    } catch (e) {
      console.error("FFT WS parse error", e);
    }
  };

  ws.onerror = (err) => {
    console.error("❌ FFT WS error", err);
    setLoading(false);
  };

  ws.onclose = () => {
    console.log("❌ FFT WS closed");
  };

  // cleanup on trigger change / unmount
  return () => {
    ws.close();
    fftWsRef.current = null;
  };
}, [trigger]);


  // Plot creation — styled to match TimeDomainGraph UI
const plot = useMemo(() => {
  if (!fftData || fftData.length === 0) return null;

  // 1) apply min / max in CURRENT unit, but filter in Hz
  let minHz = 0;
  let maxHz = Infinity;

  if (minFreq !== null && !Number.isNaN(minFreq)) {
    minHz = unit === "CPM" ? minFreq / 60 : minFreq;
  }
  if (maxFreq !== null && maxFreq !== 0 && !Number.isNaN(maxFreq)) {
    maxHz = unit === "CPM" ? maxFreq / 60 : maxFreq;
  }

  // keep things sane if user typed max < min
  if (maxHz < minHz) {
    const tmp = maxHz;
    maxHz = minHz;
    minHz = tmp;
  }

  const filtered = fftData.filter(p => p.freq >= minHz && p.freq <= maxHz);

  const dataForPlot = filtered.length > 0 ? filtered : fftData;

  const x = dataForPlot.map(p => (unit === "HZ" ? p.freq : p.freq * 60));
  const y = dataForPlot.map(p => p.value);

  // 2) build harmonic + sideband marker lines
  const shapes: any[] = [];

  if (harmonicsOn && harmonicFreq > 0 && harmonicCount > 0) {
    const baseHz = unit === "CPM" ? harmonicFreq / 60 : harmonicFreq;
    const sbDeltaHz =
      sidebandsOn && sidebandFreq > 0
        ? unit === "CPM"
          ? sidebandFreq / 60
          : sidebandFreq
        : null;

    for (let i = 1; i <= harmonicCount; i++) {
      const hHz = baseHz * i;
      const hDisp = unit === "HZ" ? hHz : hHz * 60;

      // main harmonic line
      shapes.push({
        type: "line",
        x0: hDisp,
        x1: hDisp,
        y0: 0,
        y1: 1,
        xref: "x",
        yref: "paper",
        line: {
          color: "rgba(255, 210, 120, 0.9)",
          width: 2,
          dash: "dot"
        }
      });

      // sidebands left & right
      if (sidebandsOn && sbDeltaHz && sidebandCount > 0) {
        for (let j = 1; j <= sidebandCount; j++) {
          const leftHz = hHz - sbDeltaHz * j;
          const rightHz = hHz + sbDeltaHz * j;
          if (leftHz > 0) {
            const leftDisp = unit === "HZ" ? leftHz : leftHz * 60;
            shapes.push({
              type: "line",
              x0: leftDisp,
              x1: leftDisp,
              y0: 0,
              y1: 1,
              xref: "x",
              yref: "paper",
              line: {
                color: "rgba(140, 200, 255, 0.85)",
                width: 1.5,
                dash: "dot"
              }
            });
          }
          if (rightHz > 0) {
            const rightDisp = unit === "HZ" ? rightHz : rightHz * 60;
            shapes.push({
              type: "line",
              x0: rightDisp,
              x1: rightDisp,
              y0: 0,
              y1: 1,
              xref: "x",
              yref: "paper",
              line: {
                color: "rgba(140, 200, 255, 0.85)",
                width: 1.5,
                dash: "dot"
              }
            });
          }
        }
      }
    }
  }

  return {
    data: [
      {
        x,
        y,
        type: "bar",
        marker: { color: "#7df9ff", line: { width: 0 } },
        hovertemplate: `%{x} ${unit === "HZ" ? "Hz" : "CPM"}<br>%{y}<extra></extra>`
      }
    ],
    layout: {
      title: "FFT",
      margin: { l: 60, r: 30, t: 40, b: 80 },
      xaxis: {
        title: {
          text: `Frequency (${unit === "HZ" ? "Hz" : "CPM"})`,
          font: { color: "#b4b4b4" }
        },
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
        title: { text: "Amplitude", font: { color: "#b4b4b4" } },
        automargin: true,
        color: "#b4b4b4",
        gridcolor: "rgba(143,255,112,0.12)",
        zerolinecolor: "rgba(143,255,112,0.18)"
      },
      paper_bgcolor: "transparent",
      plot_bgcolor: "transparent",
      shapes
    },
    config: {
      responsive: true,
      displayModeBar: true,
      displaylogo: false,
      scrollZoom: true,
      showTips: false,
      modeBarButtonsToRemove: ["lasso2d", "select2d"]
    }
  };
}, [
  fftData,
  unit,
  minFreq,
  maxFreq,
  harmonicsOn,
  harmonicFreq,
  harmonicCount,
  sidebandsOn,
  sidebandFreq,
  sidebandCount
]);


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
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div>{loading ? "Loading..." : (fftData ? "Ready" : "No data")}</div>
<ShimmerButton
  onClick={() =>
    setTrigger({
      assetId: "live",
      assetPartId: "live",
      axis: "X",
      dateTime: Date.now(),
      type: "LIVE"
    })
  }
  className="text-black text-base px-6 py-1 font-bold"
  background="#ffffffff"
  shimmerColor="rgba(0, 0, 0, 1)"
>
  Compute FFT
</ShimmerButton>

<ShimmerButton
  onClick={() => {
    if (fftWsRef.current) {
      fftWsRef.current.close();
      fftWsRef.current = null;
    }
  }}
  className="text-black text-base px-6 py-1 font-bold"
  background="#ffffffff"
  shimmerColor="rgba(0, 0, 0, 0.9)"
>
  Pause FFT
</ShimmerButton>



</div>

        
      </div>
      {/* Machine Settings row */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 16,
          marginBottom: 14,
          marginTop: 4
        }}
      >
        {/* Units + Min/Max */}
        <div
          style={{
            flex: "1 1 220px",
            padding: 10,
            border: "1px solid rgba(140,200,255,0.14)",
            borderRadius: 12,
background: "rgba(255, 255, 255, 0.05)",   // almost transparent
backdropFilter: "blur(100px)",              // frosted blur
WebkitBackdropFilter: "blur(10px)",        // Safari support
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 8
            }}
          >
            
            <span style={{ fontSize: 13, color: "#ffffff", fontWeight: 600 }}>
              Units
            </span>
            <div
              style={{
                display: "inline-flex",
                padding: 3,
                borderRadius: 999,
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(140,200,255,0.14)"
              }}
            >
              <button
                onClick={() => setUnit("HZ")}
                style={{
                  padding: "2px 10px",
                  borderRadius: 999,
                  border: "none",
                  fontSize: 11,
                  cursor: "pointer",
                  background:
                    unit === "HZ"
                      ? "linear-gradient(135deg,#9bfaff,#7df9ff)"
                      : "transparent",
                  color: unit === "HZ" ? "#00120a" : "#c7d6f0"
                }}
              >
                Hz
              </button>
              <button
                onClick={() => setUnit("CPM")}
                style={{
                  padding: "2px 10px",
                  borderRadius: 999,
                  border: "none",
                  fontSize: 11,
                  cursor: "pointer",
                  background:
                    unit === "CPM"
                      ? "linear-gradient(135deg,#9bfaff,#7df9ff)"
                      : "transparent",
                  color: unit === "CPM" ? "#00120a" : "#c7d6f0"
                }}
              >
                CPM
              </button>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: 8,
              marginTop: 6
            }}
          >
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 11,
                  color: "rgba(200,215,240,0.76)",
                  marginBottom: 3
                }}
              >
                Min Frequency
              </div>
              <input
                type="number"
                value={minFreq ?? ""}
                onChange={(e) =>
                  setMinFreq(
                    e.target.value === "" ? null : Number(e.target.value)
                  )
                }
                style={{
                  width: "100%",
                  padding: "6px 8px",
                  borderRadius: 8,
                  border: "1px solid rgba(140,200,255,0.14)",
                  background: "rgba(255, 255, 255, 0.05)",
                  color: "#e6f7ff",
                  fontSize: 12,
                  outline: "none"
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 11,
                  color: "rgba(200,215,240,0.76)",
                  marginBottom: 3
                }}
              >
                Max Frequency
              </div>
              <input
                type="number"
                value={maxFreq ?? ""}
                onChange={(e) =>
                  setMaxFreq(
                    e.target.value === "" ? null : Number(e.target.value)
                  )
                }
                style={{
                  width: "100%",
                  padding: "6px 8px",
                  borderRadius: 8,
                  border: "1px solid rgba(140,200,255,0.14)",
                  background: "rgba(255, 255, 255, 0.05)",
                  color: "#e6f7ff",
                  fontSize: 12,
                  outline: "none"
                }}
              />
            </div>
          </div>
        </div>

        {/* Harmonics */}
        <div
          style={{
            flex: "1 1 220px",
            padding: 10,
            borderRadius: 12,
            border: "1px solid rgba(140,200,255,0.14)",
background: "rgba(255, 255, 255, 0.05)",   // almost transparent
backdropFilter: "blur(100px)",              // frosted blur
WebkitBackdropFilter: "blur(10px)", 
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 8,
              alignItems: "center"
            }}
          >
            <span style={{ fontSize: 13, color: "#e2f2ff", fontWeight: 600 }}>
              Harmonics
            </span>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 11,
                color: "rgba(210,225,250,0.9)",
                cursor: "pointer"
              }}
            >
              <input
                type="checkbox"
                checked={harmonicsOn}
                onChange={(e) => setHarmonicsOn(e.target.checked)}
                style={{ accentColor: "#7df9ff" }}
              />
              On
            </label>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 11,
                  color: "rgba(200,215,240,0.76)",
                  marginBottom: 3
                }}
              >
                Frequency ({unit})
              </div>
              <input
                type="number"
                value={harmonicFreq}
                onChange={(e) => setHarmonicFreq(Number(e.target.value) || 0)}
                style={{
                  width: "100%",
                  padding: "6px 8px",
                  borderRadius: 8,
                  border: "1px solid rgba(140,200,255,0.14)",
                  background: "rgba(255, 255, 255, 0.05)",
                  color: "#e6f7ff",
                  fontSize: 12,
                  outline: "none"
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 11,
                  color: "rgba(200,215,240,0.76)",
                  marginBottom: 3
                }}
              >
                No. of Harmonics
              </div>
              <input
                type="number"
                value={harmonicCount}
                onChange={(e) =>
                  setHarmonicCount(Math.max(0, Number(e.target.value) || 0))
                }
                style={{
                  width: "100%",
                  padding: "6px 8px",
                  borderRadius: 8,
                  border: "1px solid rgba(140,200,255,0.14)",
                  background: "rgba(255, 255, 255, 0.05)",
                  color: "#e6f7ff",
                  fontSize: 12,
                  outline: "none"
                }}
              />
            </div>
          </div>
        </div>

        {/* Sidebands */}
        <div
          style={{
            flex: "1 1 220px",
            padding: 10,
            borderRadius: 12,
            border: "1px solid rgba(140,200,255,0.14)",
background: "rgba(255, 255, 255, 0.05)",   // almost transparent
backdropFilter: "blur(100px)",              // frosted blur
WebkitBackdropFilter: "blur(10px)", 
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 8,
              alignItems: "center"
            }}
          >
            <span style={{ fontSize: 13, color: "#e2f2ff", fontWeight: 600 }}>
              Sidebands
            </span>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 11,
                color: "rgba(210,225,250,0.9)",
                cursor: "pointer"
              }}
            >
              <input
                type="checkbox"
                checked={sidebandsOn}
                onChange={(e) => setSidebandsOn(e.target.checked)}
                style={{ accentColor: "#7df9ff" }}
              />
              On
            </label>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 11,
                  color: "rgba(200,215,240,0.76)",
                  marginBottom: 3
                }}
              >
                Sideband Freq ({unit})
              </div>
              <input
                type="number"
                value={sidebandFreq}
                onChange={(e) => setSidebandFreq(Number(e.target.value) || 0)}
                style={{
                  width: "100%",
                  padding: "6px 8px",
                  borderRadius: 8,
                  border: "1px solid rgba(140,200,255,0.14)",
                  background: "rgba(255, 255, 255, 0.05)",
                  color: "#e6f7ff",
                  fontSize: 12,
                  outline: "none"
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 11,
                  color: "rgba(200,215,240,0.76)",
                  marginBottom: 3
                }}
              >
                No. of Sidebands
              </div>
              <input
                type="number"
                value={sidebandCount}
                onChange={(e) =>
                  setSidebandCount(Math.max(0, Number(e.target.value) || 0))
                }
                style={{
                  width: "100%",
                  padding: "6px 8px",
                  borderRadius: 8,
                  border: "1px solid rgba(140,200,255,0.14)",
                  background: "rgba(255, 255, 255, 0.05)",
                  color: "#e6f7ff",
                  fontSize: 12,
                  outline: "none"
                }}
              />
            </div>
          </div>
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
