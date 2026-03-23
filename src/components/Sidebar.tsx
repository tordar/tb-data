"use client";

import { sheets } from "@/data/sheets";
import { SHEET_ICONS } from "@/lib/sheet-utils";

interface SidebarProps {
  activeSheet: number;
  isDashboard: boolean;
  sidebarOpen: boolean;
  onNavigate: (idx: number) => void;
  onClose: () => void;
}

export function Sidebar({ activeSheet, isDashboard, sidebarOpen, onNavigate, onClose }: SidebarProps) {
  return (
    <aside
      className={`fixed left-0 top-0 h-screen w-64 flex flex-col py-8 px-4 z-50 transition-transform duration-200 lg:translate-x-0 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      }`}
      style={{ backgroundColor: "var(--surface-container-low)" }}
    >
      {/* Brand */}
      <div className="mb-8 px-2">
        <h1 className="font-bold text-xl tracking-tight" style={{ color: "var(--primary)" }}>
          EV Curator
        </h1>
        <p
          className="text-xs mt-0.5 uppercase tracking-[0.18em]"
          style={{
            color: "var(--on-surface-variant)",
            opacity: 0.6,
            fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif",
            fontSize: "0.625rem",
          }}
        >
          Intelligence Report
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto">
        <button
          onClick={() => onNavigate(-1)}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors rounded-lg text-left"
          style={
            isDashboard
              ? { color: "var(--primary)", backgroundColor: "var(--nav-active-bg)", fontWeight: 600, borderRight: "3px solid var(--primary)", borderRadius: "0.375rem 0 0 0.375rem" }
              : { color: "var(--on-surface-variant)" }
          }
          onMouseEnter={(e) => {
            if (!isDashboard) {
              e.currentTarget.style.backgroundColor = "var(--surface-container)";
              e.currentTarget.style.color = "var(--foreground)";
            }
          }}
          onMouseLeave={(e) => {
            if (!isDashboard) {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "var(--on-surface-variant)";
            }
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>dashboard</span>
          <span>Dashboard</span>
        </button>
        {sheets.map((s, i) => {
          const navIcon = SHEET_ICONS[s.name] ?? "table_chart";
          const isActive = i === activeSheet;
          return (
            <button
              key={s.name}
              onClick={() => onNavigate(i)}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors rounded-lg text-left"
              style={
                isActive
                  ? {
                      color: "var(--primary)",
                      backgroundColor: "rgba(255,255,255,0.6)",
                      fontWeight: 600,
                      borderRight: "3px solid var(--primary)",
                      borderRadius: "0.375rem 0 0 0.375rem",
                    }
                  : { color: "var(--on-surface-variant)" }
              }
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = "var(--surface-container)";
                  e.currentTarget.style.color = "var(--foreground)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "var(--on-surface-variant)";
                }
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                {navIcon}
              </span>
              <span>{s.name}</span>
            </button>
          );
        })}
      </nav>

      {/* Export button */}
      <div className="pt-6 border-t" style={{ borderColor: "var(--border-subtle)" }}>
        <button
          className="w-full py-2.5 text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #3525cd, #4f46e5)" }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
            file_download
          </span>
          Export Dataset
        </button>
      </div>
    </aside>
  );
}
