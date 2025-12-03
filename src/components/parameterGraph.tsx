"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { ShimmerButton } from "@/components/ui/shimmer-button"
import { Select, InputNumber } from "antd";
import { apiUrl } from "@/lib/apiBase";
import { RainbowButton } from "./rainbow-button";
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });
// const plotListenerRef = useRef<((...args: any[]) => void) | null>(null);
type AssetOption = {
  label: string;
  assetId: string;
  assetPartId?: string;
};

const ASSET_PARTS: AssetOption[] = [
  { label: "CMTI_VIB_1", assetId: "68bff96662a095f6333cd4ee", assetPartId: "68bffc8862a095f6333cd4f1" },
  { label: "CMTI_VIB_2", assetId: "68bff96662a095f6333cd4ee", assetPartId: "68bffca762a095f6333cd4f2" },
  { label: "CMTI_VIB_3", assetId: "68bff96662a095f6333cd4ee", assetPartId: "691c449a45f1fc12437dbe02" },
  { label: "CMTI_VIB_4", assetId: "68bff96662a095f6333cd4ee", assetPartId: "691c44f445f1fc12437dbe05" },
];

const AXES = [
  { label: "H-Axis", value: "H-Axis", assetId: "68bff96662a095f6333cd4ee" },
  { label: "V-Axis", value: "V-Axis", assetId: "68bff96662a095f6333cd4ee" },
  { label: "A-Axis", value: "A-Axis", assetId: "68bff96662a095f6333cd4ee" },
];

const PARAMETERS = [
  { label: "Velocity", value: "Velocity", assetId: "68bff96662a095f6333cd4ee" },
  { label: "Acceleration", value: "Acceleration", assetId: "68bff96662a095f6333cd4ee" },
  { label: "Acceleration Envelope", value: "AccelerationEnvelope", assetId: "68bff96662a095f6333cd4ee" },
];

export default function ParameterGraph({ onPointSelected, onTokenChange }: {
  onPointSelected?: (p: { assetId: string; assetPartId: string; axis: string; dateTime: number; type: string }) => void;
  onTokenChange?: (token: string) => void;
}) {
  const [assetPart, setAssetPart] = useState<string>("");
  const [axis, setAxis] = useState<string>("");
  const [parameter, setParameter] = useState<string>("");
  const [days, setDays] = useState<number>(0);
  const [token, setToken] = useState<string>("");
  const [dataRows, setDataRows] = useState<{ ts: string; value: number }[] | null>(null);
  const [loading, setLoading] = useState(false);
  const plotRef = useRef<any>(null);
  const plotListenerRef = useRef<((...args: any[]) => void) | null>(null);

  useEffect(() => {
    return () => {
      // cleanup listener on unmount
      try {
        const gd: any = plotRef.current;
        if (gd) {
          if (plotListenerRef.current && typeof gd.removeListener === "function") {
            gd.removeListener("plotly_click", plotListenerRef.current);
          } else if (typeof gd.removeAllListeners === "function") {
            gd.removeAllListeners("plotly_click");
          } else if (plotListenerRef.current && typeof gd.removeEventListener === "function") {
            gd.removeEventListener("click", plotListenerRef.current);
          }
        }
      } catch (e) {
        console.warn("[ParameterGraph] cleanup error:", e);
      }
    };
  }, []);

  function validateInputs() {
    return assetPart && axis && parameter && token;
  }

  async function handlePlot() {
    console.log("TOKEN USED:", token);

    if (!validateInputs()) {
      alert("Select asset part, axis, parameter and paste JWT token before plotting.");
      return;
    }

    if (!token || token === "abcdef") {
      alert("Please click on the Authorize button before plotting.");
      return;
    }
    setLoading(true);
    try {
      const selected = ASSET_PARTS.find(a => a.assetPartId === assetPart)!;
      const body = {
        assetId: selected.assetId,
        assetPartId: selected.assetPartId,
        axis: axis,
        days: days,
        type: parameter
      };
      const resp = await fetch(apiUrl("/api/assetpart/ParameterTrends"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token.replace(/^Bearer\s+/i, "")}`
        },
        body: JSON.stringify(body)
      });
      if (!resp.ok) {
        if (resp.status === 401) {
          throw new Error("Unauthorized. Please click on the Authorize button before plotting.");
        }
        const text = await resp.text();
        throw new Error(`Status ${resp.status}: ${text}`);
      }

      const json = await resp.json();
      // Expected structure (from backend example): { name: "...", value: [ [ts, value], ... ] }
      // adapt to plot format
      const v: any[] = json.value || [];
      const rows = v.map((r: any) => {
        // many backends send timestamp in ms or iso: accomodate both
        let ts = r[0];
        let val = Number(r[1]);
        if (Number.isFinite(ts) && String(ts).length >= 10) {
          // maybe unix ms or s
          if (String(ts).length === 10) ts = Number(ts) * 1000;
          else ts = Number(ts);
          ts = new Date(ts).toISOString();
        } else {
          // try string
          ts = String(r[0]);
        }
        return { ts, value: Number.isFinite(val) ? val : NaN };
      }).filter((rr: any) => rr.ts && Number.isFinite(rr.value));
      setDataRows(rows);
    } catch (err: any) {
      console.error(err);
      alert("Failed to fetch Parameter Trends: " + err.message);
    } finally { setLoading(false); }
  }
  const getUnit = () => {
    if (parameter === "Velocity") return "mm/s";
    if (parameter === "Acceleration") return "g";
    if (parameter === "AccelerationEnvelope") return "gE";
    return "";
  };
  // Plotly trace construction
  const plotData = useMemo(() => {
    if (!dataRows || dataRows.length === 0) return null;
    const x = dataRows.map(r => r.ts);
    const y = dataRows.map(r => r.value);
    return {
      data: [
        {
          x,
          y,
          type: "scatter",
          mode: "lines+markers",
          line: { shape: "spline", width: 2, color: "#8FFF70" },
          marker: { size: 8, opacity: 0.5, color: "#8FFF70", line: { width: 0 } },// larger markers so clicks hit
          hovertemplate: "%{x}<br><b>Value</b>: %{y}<extra></extra>",
          // set hoverinfo to ensure markers are targetable
        }
      ],
      layout: {
        margin: { l: 60, r: 30, t: 40, b: 120 },
        xaxis: {
          rangeslider: {
            visible: true,
            thickness: 0.07,
            bgcolor: "rgba(255,255,255,0.2)"
          },
          tickangle: -35,
          type: "date",
          color: "#b4b4b4ff",
          title: { font: { color: "#b4b4b4ff" } },

          // ➜ GRID COLOR
          gridcolor: "rgba(143, 255, 112, 0.15)",      // soft neon green
          zerolinecolor: "rgba(143, 255, 112, 0.25)",  // slightly brighter main line
        },
        yaxis: {
          automargin: true,
          color: "#b4b4b4ff",
          title: {
            text: getUnit(),          // ★ dynamic unit
            font: { color: "#b4b4b4ff" }
          },

          // ➜ GRID COLOR
          gridcolor: "rgba(143, 255, 112, 0.15)",
          zerolinecolor: "#b4b4b4",
        },

        hovermode: "closest",   // 'closest' helps click on nearest point
        clickmode: "event+select", // ensure Plotly emits events for clicks
        paper_bgcolor: "transparent",
        plot_bgcolor: "transparent",
      },
      config: {
        responsive: true,
        displayModeBar: true,
        displaylogo: false,
        scrollZoom: true,
        showTips: false,
      }
    };
  }, [dataRows]);


  // click handler for points -- emits to parent
  async function handlePointClick(event: any) {
    console.log("[ParameterGraph] handlePointClick called with:", event);

    // Plotly sometimes sends event.points, sometimes event.event?.points etc.
    const pts = event?.points || event?.data?.points || event?.event?.points || null;
    if (!pts || !pts.length) {
      console.warn("[ParameterGraph] no points found on click event:", event);
      return;
    }

    const pt = pts[0];
    console.log("[ParameterGraph] clicked point object:", pt);

    // pt.x might be ISO string or number (seconds or ms)
    let x = pt.x;
    let dtMs = Number.NaN;

    if (typeof x === "string") {
      dtMs = Date.parse(x);
      if (isNaN(dtMs)) {
        // maybe formatted in a way Date.parse can't handle
        dtMs = Number(x);
      }
    } else if (typeof x === "number") {
      dtMs = x;
      // if it looks like seconds (10-digit), convert to ms
      if (String(x).length === 10) dtMs = x * 1000;
    }

    if (isNaN(dtMs)) {
      console.warn("[ParameterGraph] could not parse timestamp from point.x:", x);
      return;
    }

    const selected = ASSET_PARTS.find(a => a.assetPartId === assetPart);
    if (!selected) {
      console.warn("[ParameterGraph] no selected assetPart in state, cannot emit");
      return;
    }

    const payload = {
      assetId: selected.assetId,
      assetPartId: selected.assetPartId!,
      axis,
      dateTime: Math.floor(dtMs / 1000), // seconds
      type: parameter
    };

    console.log("[ParameterGraph] emitting onPointSelected payload:", payload);
    if (typeof onPointSelected === "function") onPointSelected(payload);
  }



  // futuristic style variables
  const cardStyle: React.CSSProperties = {
    padding: 18,
    marginTop: 18,
    borderRadius: 14,
    // neon / glass look
    background: "linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))",
    border: "1px solid rgba(120,180,255,0.06)",
    boxShadow: "0 8px 30px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.02)",
    color: "#dbeeff",
    // slightly translucent so page bg shows through
    backdropFilter: "blur(6px) saturate(120%)",
  };

  const headerTitleStyle: React.CSSProperties = { fontWeight: 800, fontSize: 16, color: "#ffffff" };
  const headerSubtitleStyle: React.CSSProperties = { color: "rgba(180,210,240,0.6)", fontSize: 13 };

  const controlStyle: React.CSSProperties = {
    padding: 10,
    borderRadius: 10,
    background: "linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))",
    border: "1px solid rgba(255,255,255,0.03)",
    color: "#dbeeff",
    outline: "none",
    minWidth: 160,
    boxShadow: "inset 0 -6px 18px rgba(0,0,0,0.6)",
  };

  const inputTokenStyle: React.CSSProperties = {
    width: 380,
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid rgba(120,180,255,0.09)",
    background: "linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))",
    color: "#cfefff",
    boxShadow: "inset 0 2px 8px rgba(0,0,0,0.6)",
    outline: "none",
  };

  const smallControlStyle: React.CSSProperties = { ...controlStyle, minWidth: 110, padding: 8 };

  const neonButtonStyle: React.CSSProperties = {
    padding: "9px 14px",
    borderRadius: 10,
    background: "linear-gradient(90deg,#3ad7ff,#7af0b0)",
    border: "none",
    fontWeight: 800,
    color: "#00141a",
    boxShadow: "0 6px 30px rgba(58,215,255,0.12), 0 0 18px rgba(122,240,176,0.08)",
    cursor: "pointer"
  };

  const plotWrapStyle: React.CSSProperties = {
    height: 480,
    borderRadius: 12,
    overflow: "hidden",
    // dark card inside with faint grid lines
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 8 }}>
        <div>
          <div style={headerTitleStyle}>Parameter Trend — Vibration</div>
          <div style={headerSubtitleStyle}>Click a point to select timestamp</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <RainbowButton
            onClick={async () => {
              // If already authorized → Unauthorize
              if (token && token !== "abcdef") {
                setToken("abcdef");
                if (onTokenChange) onTokenChange("abcdef");
                return;
              }

              // Otherwise → Authorize
              try {
                const resp = await fetch(apiUrl("/auth/login"), {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    email: "cmti@enmaz.com",
                    password: "Password@123",
                  }),
                });

                if (!resp.ok) {
                  const text = await resp.text();
                  alert("Authorization failed: " + text);
                  return;
                }

                const json = await resp.json();
                const tok = json?.token;

                if (!tok) {
                  alert("Token not found in response");
                  return;
                }

                setToken(tok);
                if (onTokenChange) onTokenChange(tok);
                console.log("Successfully authorized!");
              } catch (err: any) {
                console.log("Authorization error: " + err.message);
              }
            }}
            className="px-4 py-2 font-bold text-xl hover:scale-105 transition-transform"
          >
            {token && token !== "abcdef" ? "Unauthorize" : "Authorize"}
          </RainbowButton>
        </div>

      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>


        <Select
          value={assetPart || undefined}
          onChange={(v) => setAssetPart(v)}
          placeholder="Select Asset Part"
          options={ASSET_PARTS.map(a => ({
            label: a.label,
            value: a.assetPartId
          }))}
          className="futuristic-select"
          style={{ width: 180, background: "#ffffffff", border: "0.2px solid #1f2937" }}
        />
        <Select
          value={axis || undefined}
          onChange={(v) => setAxis(v)}
          placeholder="Select Axis"
          options={AXES.map(a => ({ label: a.label, value: a.value }))}
          className="futuristic-select"
          style={{ width: 150, background: "#ffffffff", border: "0.2px solid #1f2937" }}
        />
        <Select
          value={parameter || undefined}
          onChange={(v) => setParameter(v)}
          placeholder="Select Parameter"
          options={PARAMETERS.map(p => ({ label: p.label, value: p.value }))}
          className="futuristic-select"
          style={{ width: 200, background: "#ffffffff", border: "0.2px solid #1f2937" }}
        />

        <InputNumber
          min={0}
          max={3650}
          value={days}
          onChange={(v) => setDays(Number(v))}
          className="futuristic-select"
          style={{ width: 100 }}
        />
        <ShimmerButton
          onClick={handlePlot}
          disabled={loading}
          className="text-black text-base px-6 py-1 font-bold"
          shimmerColor="rgba(0, 0, 0, 1)"
          background="#ffffffff"
        >
          {loading ? "Loading..." : "Plot"}
        </ShimmerButton>
      </div>

      <div style={plotWrapStyle}>
        <div style={watermarkStyle}>VIB • realtime</div>

        {plotData ? (
          <Plot
            data={plotData.data as any}
            layout={plotData.layout as any}
            config={{
              responsive: true,
              displaylogo: false,
              scrollZoom: true,
              showTips: false,
              modeBarButtonsToRemove: ["lasso2d", "select2d"],
            }}
            style={{ width: "100%", height: "100%" }}
            onClick={handlePointClick}
            onInitialized={(_figure, graphDiv) => {
              try {
                plotRef.current = graphDiv;
                const gd: any = graphDiv;

                // remove previously-attached listener if any
                try {
                  if (plotListenerRef.current && typeof gd.removeListener === "function") {
                    gd.removeListener("plotly_click", plotListenerRef.current);
                  } else if (plotListenerRef.current && typeof gd.removeAllListeners === "function") {
                    gd.removeAllListeners("plotly_click");
                  }
                } catch (e) {
                  console.warn("[ParameterGraph] previous-remove threw:", e);
                }

                // attach new listener (store it so we can remove later)
                if (gd && typeof gd.on === "function") {
                  const fn = (eventData: any) => {
                    handlePointClick(eventData);
                  };
                  gd.on("plotly_click", fn);
                  plotListenerRef.current = fn;
                } else if (gd && typeof gd.addEventListener === "function") {
                  const fallback = (ev: any) => {
                    // fallback (no-op logging)
                  };
                  gd.addEventListener("click", fallback);
                  plotListenerRef.current = fallback;
                } else {
                  // nothing to attach to
                }
              } catch (err) {
                console.error("[ParameterGraph] error in onInitialized:", err);
              }
            }}
            onUpdate={(_figure, graphDiv) => {
              // keep ref updated if plot re-renders
              plotRef.current = graphDiv;
            }}
          />
        ) : (
          <div style={{ padding: 28, color: "rgba(190,210,240,0.6)" }}>
            Click on Authorize and select asset part, axis, parameter, paste JWT, then click Plot to fetch Parameter trends.
          </div>
        )}
      </div>
    </div>
  );
}
