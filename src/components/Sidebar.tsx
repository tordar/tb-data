"use client";

import { useState, useEffect, useRef } from "react";
import { sheets } from "@/data/sheets";
import { SHEET_ICONS } from "@/lib/sheet-utils";

interface SidebarProps {
  activeSheet: number;
  isDashboard: boolean;
  sidebarOpen: boolean;
  onNavigate: (idx: number) => void;
  onClose: () => void;
  onExport: (format: "csv" | "pdf") => void;
}

export function Sidebar({ activeSheet, isDashboard, sidebarOpen, onNavigate, onClose, onExport }: SidebarProps) {
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!exportOpen) return;
    function handleClick(e: MouseEvent) {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [exportOpen]);

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
      <div className="pt-6 border-t relative" style={{ borderColor: "var(--border-subtle)" }} ref={exportRef}>
        {exportOpen && (
          <div
            className="absolute bottom-full mb-2 left-0 right-0 rounded-lg overflow-hidden shadow-lg"
            style={{ backgroundColor: "var(--surface-container)", border: "1px solid var(--border-subtle)" }}
          >
            <button
              onClick={() => { onExport("csv"); setExportOpen(false); }}
              className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-medium text-left"
              style={{ color: "var(--on-surface-variant)", borderBottom: "1px solid var(--border-subtle)" }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--surface-container-high)"; e.currentTarget.style.color = "var(--foreground)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "var(--on-surface-variant)"; }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>table</span>
              Export as CSV
            </button>
            <button
              onClick={() => { onExport("pdf"); setExportOpen(false); }}
              className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-medium text-left"
              style={{ color: "var(--on-surface-variant)" }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--surface-container-high)"; e.currentTarget.style.color = "var(--foreground)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "var(--on-surface-variant)"; }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>picture_as_pdf</span>
              Export as PDF
            </button>
          </div>
        )}
        <button
          onClick={() => setExportOpen((o) => !o)}
          className="w-full py-2.5 text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #3525cd, #4f46e5)" }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>file_download</span>
          Export Dataset
        </button>
      </div>

      {/* Attribution */}
      <div className="pt-4 pb-1">
        <p className="text-xs" style={{ color: "var(--on-surface-variant)", opacity: 0.5 }}>
          Data source:{" "}
          <a
            href="https://docs.google.com/spreadsheets/d/1V6ucyFGKWuSQzvI8lMzvvWJHrBS82echMVJH37kwgjE/edit?gid=244400016#gid=244400016"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2"
            style={{ color: "var(--on-surface-variant)" }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = ""; }}
          >
            Bjørn Nyland&apos;s TB Test Results
          </a>
        </p>
      </div>
    </aside>
  );
}
