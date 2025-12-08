"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { ShimmerButton } from "@/components/ui/shimmer-button"
import { Select, InputNumber } from "antd";
import { apiUrl } from "@/lib/apiBase";
import { RainbowButton } from "./rainbow-button";
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

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
  // dataRows now keep tsMs and tsISO for robust handling
  const [dataRows, setDataRows] = useState<{ tsMs: number; ts: string; value: number }[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [refX, setRefX] = useState<string | number | Date | null>(null);
  const [xRange, setXRange] = useState<[string | number | Date, string | number | Date] | null>(null);
  const [yRange, setYRange] = useState<[number, number] | null>(null);
  const [timeRange, setTimeRange] = useState<"1h" | "1w" | "1m" | "1y" | "all">("1h");
  const plotRef = useRef<any>(null);
  const plotListenerRef = useRef<((...args: any[]) => void) | null>(null);

  useEffect(() => {
    return () => {
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

  // helper: normalize timestamp (ISO string, ms, or seconds) -> ms
  function parseTimestampToMs(raw: any): number {
    if (raw === null || raw === undefined) return NaN;
    // numbers
    if (typeof raw === "number") {
      const s = String(Math.trunc(raw));
      // seconds (10 digits) -> convert to ms
      if (s.length === 10) return raw * 1000;
      // milliseconds (13 digits)
      if (s.length >= 12) return raw;
      // fallback
      return raw;
    }
    // string: try integer numeric
    if (typeof raw === "string") {
      const trimmed = raw.trim();
      // numeric string?
      if (/^\d+$/.test(trimmed)) {
        if (trimmed.length === 10) return Number(trimmed) * 1000;
        if (trimmed.length >= 12) return Number(trimmed);
        return Number(trimmed);
      }
      // else try Date.parse (ISO / RFC formats)
      const parsed = Date.parse(trimmed);
      if (!isNaN(parsed)) return parsed;
      // final fallback: Number()
      const n = Number(trimmed);
      if (!isNaN(n)) {
        if (String(Math.trunc(n)).length === 10) return n * 1000;
        return n;
      }
    }
    return NaN;
  }

  // map timeRange to window milliseconds
  function timeRangeToMs(range: "1h" | "1w" | "1m" | "1y") {
    switch (range) {
      case "1h": return 60 * 60 * 1000;
      case "1w": return 7 * 24 * 60 * 60 * 1000;
      case "1m": return 30 * 24 * 60 * 60 * 1000;
      case "1y": return 365 * 24 * 60 * 60 * 1000;
      default: return 60 * 60 * 1000;
    }
  }

  async function handlePlot() {
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

      // If backend returns 204 No Content, treat as no data
      if (resp.status === 204) {
        alert("  DATA NOT AVAILABLE ");
        setDataRows(null);
        return;
      }

      const json = await resp.json();
      const vRaw: any[] = Array.isArray(json?.value)
        ? json.value
        : Array.isArray(json)
          ? json
          : Array.isArray(json?.data)
            ? json.data
            : [];

      // No rows at all
      if (!Array.isArray(vRaw) || vRaw.length === 0) {
        alert("  DATA NOT AVAILABLE ");
        setDataRows(null);
        return;
      }

      // Normalize and convert to tsMs + ISO
      const normalized = vRaw
        .map((r: any) => {
          const rawTs = r[0];
          const val = Number(r[1]);
          const tsMs = parseTimestampToMs(rawTs);
          const tsISO = !isNaN(tsMs) ? new Date(tsMs).toISOString() : String(rawTs);
          return {
            tsMs,
            ts: tsISO,
            value: Number.isFinite(val) ? val : NaN,
          };
        })
        .filter(rr => rr.tsMs && Number.isFinite(rr.value));

      if (!normalized || normalized.length === 0) {
        alert("  DATA NOT AVAILABLE ");
        setDataRows(null);
        return;
      }

      // Sort ascending by time
      normalized.sort((a, b) => a.tsMs - b.tsMs);
      if (timeRange === "all") {
        setDataRows(normalized);
        setXRange(null);
        setYRange(null);
        return;
      }
            // 🔑 REAL-TIME WINDOW CHECK (what you asked for)
      // Get unix cutoff based on current time and selected range (1h / 1w / 1m / 1y)
      const nowMs = Date.now();
      const windowMs = timeRangeToMs(timeRange);
      const cutoffMs = nowMs - windowMs;

      // Latest point in data (since normalized is ascending, use last index)
      const latest = normalized[normalized.length - 1];

      // If even the latest point is older than cutoff => no data in selected range
      if (latest.tsMs < cutoffMs) {
        alert("  DATA NOT AVAILABLE ");
        setDataRows(null);
        return;
      }

      // ✅ Filter to only points inside selected window relative to NOW
      const filtered = normalized.filter(r => r.tsMs >= cutoffMs);

      if (!filtered || filtered.length === 0) {
        // (This is redundant given the latest check, but kept for safety)
        alert("  DATA NOT AVAILABLE ");
        setDataRows(null);
        return;
      }

      // Store filtered rows for plot (these already satisfy your time window)
      setDataRows(filtered);
      setXRange(null);
      setYRange(null);
    } catch (err: any) {
      console.error(err);
      alert("Failed to fetch Parameter Trends: " + (err?.message ?? String(err)));
    } finally {
      setLoading(false);
    }
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
    const x = dataRows.map(r => r.ts); // ISO strings for plotly date axis
    const y = dataRows.map(r => r.value);
    const customdata = dataRows.map(r => r.tsMs); // helpful for reliable clicks
    const defaultXRange: [string | number | Date, string | number | Date] = [
      x[0],
      x[x.length - 1],
    ];

    return {
      data: [
        {
          x,
          y,
          customdata,
          type: "scatter",
          mode: "lines+markers",
          line: { shape: "spline", width: 2, color: "#8FFF70" },
          marker: { size: 8, opacity: 0.5, color: "#8FFF70", line: { width: 0 } },
          hovertemplate: "%{x}<br><b>Value</b>: %{y}<extra></extra>",
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
          gridcolor: "rgba(143, 255, 112, 0.15)",
          zerolinecolor: "rgba(143, 255, 112, 0.25)",
          range: xRange ?? defaultXRange,
          autorange: false,
        },
        yaxis: {
          automargin: true,
          color: "#b4b4b4ff",
          title: {
            text: getUnit(),
            font: { color: "#b4b4b4ff" }
          },
          gridcolor: "rgba(143, 255, 112, 0.15)",
          zerolinecolor: "#b4b4b4",
          range: yRange ?? undefined,
          autorange: yRange ? false : true,
        },

        hovermode: "x",
        hoverdistance: -1,
        clickmode: "event+select",
        paper_bgcolor: "transparent",
        plot_bgcolor: "transparent",
        shapes: refX
          ? [
            {
              type: "line",
              x0: refX,
              x1: refX,
              y0: 0,
              y1: 1,
              xref: "x",
              yref: "paper",
              line: {
                color: "rgba(200,200,200,0.6)",
                width: 2,
                dash: "dot"
              }
            }
          ]
          : [],

      },
      config: {
        responsive: true,
        displayModeBar: true,
        displaylogo: false,
        scrollZoom: true,
        showTips: false,
      }
    };
  }, [dataRows, refX, parameter, xRange, yRange]);

  // click handler for points -- emits to parent
  async function handlePointClick(event: any) {
    // event can be varied; prefer to read pt.customdata if available
    const pts = event?.points || event?.data?.points || event?.event?.points || null;
    if (!pts || !pts.length) {
      console.warn("[ParameterGraph] no points found on click event:", event);
      return;
    }

    const pt = pts[0];
    setRefX(pt.x as string | number | Date);

    // Try to read tsMs from customdata (most reliable). Fallback to parsing pt.x.
    let dtMs = Number.NaN;
    if (pt.customdata !== undefined && pt.customdata !== null) {
      dtMs = Number(pt.customdata);
    }

    if (isNaN(dtMs)) {
      // fallback parse
      const x = pt.x;
      if (typeof x === "string") {
        dtMs = Date.parse(x);
        if (isNaN(dtMs)) {
          dtMs = Number(x);
        }
      } else if (typeof x === "number") {
        dtMs = x;
        if (String(x).length === 10) dtMs = x * 1000;
      }
    }

    if (isNaN(dtMs)) {
      console.warn("[ParameterGraph] could not parse timestamp from point.x:", pt.x);
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

    if (typeof onPointSelected === "function") onPointSelected(payload);
  }

  // Styles (kept from your original)
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
  const [authLoading, setAuthLoading] = useState(false);

  return (
    <div style={cardStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 8 }}>
        <div>
          <div style={headerTitleStyle}>Parameter Trend — Vibration</div>
          <div style={headerSubtitleStyle}>Click a point to select timestamp</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <RainbowButton
            disabled={authLoading}
            onClick={async () => {
              if (token && token !== "abcdef" && !authLoading) {
                setToken("abcdef");
                if (onTokenChange) onTokenChange("abcdef");
                return;
              }
              try {
                setAuthLoading(true);
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
                  setAuthLoading(false);
                  return;
                }
                const json = await resp.json();
                const tok = json?.token;
                if (!tok) {
                  alert("Token not found in response");
                  setAuthLoading(false);
                  return;
                }
                setToken(tok);
                if (onTokenChange) onTokenChange(tok);
                console.log("Successfully authorized!");
              } catch (err: any) {
                console.log("Authorization error: " + err?.message);
              } finally {
                setAuthLoading(false);
              }
            }}
            className="px-4 py-2 font-bold text-xl hover:scale-105 transition-transform"
          >
            {authLoading
              ? "Authorizing..."
              : token && token !== "abcdef"
                ? "Unauthorize"
                : "Authorize"}
          </RainbowButton>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <Select
          value={assetPart || undefined}
          onChange={(v) => setAssetPart(v)}
          placeholder="Select Asset Part"
          options={ASSET_PARTS.map(a => ({ label: a.label, value: a.assetPartId }))}
          className="futuristic-select"
          style={{ width: 180 }}
        />
        <Select
          value={axis || undefined}
          onChange={(v) => setAxis(v)}
          placeholder="Select Axis"
          options={AXES.map(a => ({ label: a.label, value: a.value }))}
          className="futuristic-select"
          style={{ width: 150 }}
        />
        <Select
          value={parameter || undefined}
          onChange={(v) => setParameter(v)}
          placeholder="Select Parameter"
          options={PARAMETERS.map(p => ({ label: p.label, value: p.value }))}
          className="futuristic-select"
          style={{ width: 200 }}
        />

        <InputNumber
          min={0}
          max={3650}
          value={days}
          onChange={(v) => setDays(Number(v))}
          className="futuristic-select"
          style={{ width: 100 }}
        />

        {/* Time range selector (defaults to 1 hour) */}
        <Select
          value={timeRange}
          onChange={(v: any) => setTimeRange(v)}
          options={[
            { label: "Last 1 hour", value: "1h" },
            { label: "Last 1 week", value: "1w" },
            { label: "Last 1 month", value: "1m" },
            { label: "Last 1 year", value: "1y" },
            { label: "All data", value: "all" },
          ]}
          style={{ width: 160 }}
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
            onHover={(event) => {
              const pt = event?.points?.[0];
              if (!pt) return;
              const xVal = pt.x as string | number | Date;
              setRefX(xVal);
            }}
            onUnhover={() => setRefX(null)}
            onRelayout={(e: any) => {
              // X axis
              let xr0 =
                e["xaxis.range[0]"] ??
                (Array.isArray(e["xaxis.range"]) ? e["xaxis.range"][0] : undefined);
              let xr1 =
                e["xaxis.range[1]"] ??
                (Array.isArray(e["xaxis.range"]) ? e["xaxis.range"][1] : undefined);

              if (xr0 !== undefined && xr1 !== undefined) {
                setXRange([xr0, xr1]);
              } else if (e["xaxis.autorange"]) {
                setXRange(null);
              }

              // Y axis
              let yr0 =
                e["yaxis.range[0]"] ??
                (Array.isArray(e["yaxis.range"]) ? e["yaxis.range"][0] : undefined);
              let yr1 =
                e["yaxis.range[1]"] ??
                (Array.isArray(e["yaxis.range"]) ? e["yaxis.range"][1] : undefined);

              if (yr0 !== undefined && yr1 !== undefined) {
                setYRange([yr0, yr1]);
              } else if (e["yaxis.autorange"]) {
                setYRange(null);
              }
            }}
            onInitialized={(_figure, graphDiv) => {
              try {
                plotRef.current = graphDiv;
                const gd: any = graphDiv;
                try {
                  if (plotListenerRef.current && typeof gd.removeListener === "function") {
                    gd.removeListener("plotly_click", plotListenerRef.current);
                  } else if (plotListenerRef.current && typeof gd.removeAllListeners === "function") {
                    gd.removeAllListeners("plotly_click");
                  }
                } catch (e) {
                  console.warn("[ParameterGraph] previous-remove threw:", e);
                }

                if (gd && typeof gd.on === "function") {
                  const fn = (eventData: any) => {
                    handlePointClick(eventData);
                  };
                  gd.on("plotly_click", fn);
                  plotListenerRef.current = fn;
                } else if (gd && typeof gd.addEventListener === "function") {
                  const fallback = (ev: any) => { };
                  gd.addEventListener("click", fallback);
                  plotListenerRef.current = fallback;
                }
              } catch (err) {
                console.error("[ParameterGraph] error in onInitialized:", err);
              }
            }}
            onUpdate={(_figure, graphDiv) => {
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
