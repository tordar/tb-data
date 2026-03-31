import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "TB Test Results Explorer — Real-world EV test data by Bjørn Nyland";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#0f172a",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Left accent bar */}
        <div style={{ width: 8, background: "#3525cd", flexShrink: 0 }} />

        {/* Main content */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "64px 72px",
          }}
        >
          {/* Top: label */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                background: "#3525cd",
                borderRadius: 6,
                padding: "4px 14px",
                fontSize: 13,
                fontWeight: 700,
                color: "#fff",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              EV Test Data
            </div>
            <div style={{ color: "#64748b", fontSize: 14 }}>
              Based on Bjørn Nyland&apos;s real-world tests
            </div>
          </div>

          {/* Middle: headline */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div
              style={{
                fontSize: 72,
                fontWeight: 800,
                color: "#f8fafc",
                lineHeight: 1.05,
                letterSpacing: "-0.02em",
              }}
            >
              TB Test Results
            </div>
            <div
              style={{
                fontSize: 26,
                color: "#94a3b8",
                fontWeight: 400,
              }}
            >
              Interactive explorer for electric vehicle performance data
            </div>
          </div>

          {/* Bottom: stats */}
          <div style={{ display: "flex", gap: 48 }}>
            {[
              { value: "663", label: "EVs tested" },
              { value: "1,986", label: "Test entries" },
              { value: "14", label: "Test categories" },
            ].map((stat) => (
              <div
                key={stat.label}
                style={{ display: "flex", flexDirection: "column", gap: 4 }}
              >
                <div
                  style={{
                    fontSize: 42,
                    fontWeight: 800,
                    color: "#dad7ff",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {stat.value}
                </div>
                <div style={{ fontSize: 16, color: "#64748b", fontWeight: 500 }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: decorative grid */}
        <div
          style={{
            width: 280,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "48px 40px",
            gap: 12,
            background: "#1e293b",
            borderLeft: "1px solid #334155",
          }}
        >
          {["Range", "Acceleration", "Braking", "Noise", "Cargo", "Weight"].map(
            (label, i) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 14px",
                  borderRadius: 8,
                  background: i === 0 ? "#3525cd22" : "transparent",
                  border: i === 0 ? "1px solid #3525cd55" : "1px solid transparent",
                }}
              >
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: i === 0 ? "#dad7ff" : "#475569",
                    flexShrink: 0,
                  }}
                />
                <div
                  style={{
                    fontSize: 15,
                    color: i === 0 ? "#dad7ff" : "#64748b",
                    fontWeight: i === 0 ? 600 : 400,
                  }}
                >
                  {label}
                </div>
              </div>
            )
          )}
        </div>
      </div>
    ),
    { ...size }
  );
}
