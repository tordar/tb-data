"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { getTests, getAllTestSheets } from "@/lib/data/tests";

interface SidebarProps {
  pathname: string;
  sidebarOpen: boolean;
  onClose: () => void;
  resolvedTheme: string | undefined;
  onThemeToggle: () => void;
}

export function Sidebar({ pathname, sidebarOpen, onClose, resolvedTheme, onThemeToggle }: SidebarProps) {
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);
  const tests = getTests();

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

  function handleExport(format: "csv" | "pdf") {
    const sheets = getAllTestSheets();

    if (format === "csv") {
      const csvParts = sheets.map((s) => {
        const headerLine = s.headers.join(",");
        const dataLines = s.rows.map((r) =>
          r.map((c) => (c.includes(",") || c.includes('"') ? `"${c.replace(/"/g, '""')}"` : c)).join(",")
        );
        return `--- ${s.name} ---\n${headerLine}\n${dataLines.join("\n")}`;
      });
      const blob = new Blob([csvParts.join("\n\n")], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "tb-test-results.csv";
      a.click();
      URL.revokeObjectURL(url);
    } else {
      // PDF export — open print dialog
      window.print();
    }
  }

  const ROUTE_CHALLENGE_SLUGS = new Set(["arctic-circle", "bangkok", "geilo"]);

  const coreTests = tests.filter((t) => !ROUTE_CHALLENGE_SLUGS.has(t.slug));
  const routeChallenges = tests.filter((t) => ROUTE_CHALLENGE_SLUGS.has(t.slug));
  const routeActive = routeChallenges.some((t) => pathname.startsWith(`/tests/${t.slug}`));
  const [routesOpen, setRoutesOpen] = useState(routeActive);

  const navItems = [
    { label: "Dashboard", href: "/", icon: "dashboard" },
    ...coreTests.map((t) => ({
      label: t.name,
      href: `/tests/${t.slug}`,
      icon: t.icon,
    })),
  ];

  return (
    <aside
      className={`fixed left-0 top-0 h-screen w-64 flex flex-col py-8 px-4 z-50 transition-transform duration-200 lg:translate-x-0 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      }`}
      style={{ backgroundColor: "var(--surface-container-low)" }}
    >
      {/* Brand + theme toggle */}
      <div className="mb-8 px-2 flex items-start justify-between">
        <div>
          <h1 className="font-bold text-xl tracking-tight" style={{ color: "var(--primary)" }}>
            TB Test Results
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
            Explorer
          </p>
        </div>
        <button
          onClick={onThemeToggle}
          className="p-2 rounded-lg transition-colors mt-0.5"
          style={{ color: "var(--on-surface-variant)", backgroundColor: "var(--surface-container)" }}
          aria-label="Toggle dark mode"
        >
          <span className="material-symbols-outlined" style={{ fontSize: "18px" }} suppressHydrationWarning>
            {resolvedTheme === "dark" ? "light_mode" : "dark_mode"}
          </span>
        </button>
      </div>

      {/* Scrollable nav — everything scrolls together */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors rounded-lg text-left"
              style={
                isActive
                  ? {
                      color: "var(--primary)",
                      backgroundColor: "var(--nav-active-bg)",
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
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}

        {/* Route Challenges dropdown */}
        <button
          onClick={() => setRoutesOpen((o) => !o)}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors rounded-lg text-left mt-1"
          style={{ color: routeActive ? "var(--primary)" : "var(--on-surface-variant)" }}
          onMouseEnter={(e) => {
            if (!routeActive) {
              e.currentTarget.style.backgroundColor = "var(--surface-container)";
              e.currentTarget.style.color = "var(--foreground)";
            }
          }}
          onMouseLeave={(e) => {
            if (!routeActive) {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "var(--on-surface-variant)";
            }
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>route</span>
          <span className="flex-1">Route Challenges</span>
          <span
            className="material-symbols-outlined transition-transform"
            style={{ fontSize: "16px", transform: routesOpen ? "rotate(180deg)" : "rotate(0deg)" }}
          >
            expand_more
          </span>
        </button>
        {routesOpen && (
          <div className="ml-4">
            {routeChallenges.map((t) => {
              const href = `/tests/${t.slug}`;
              const isActive = pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={onClose}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors rounded-lg text-left"
                  style={
                    isActive
                      ? {
                          color: "var(--primary)",
                          backgroundColor: "var(--nav-active-bg)",
                          fontWeight: 600,
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
                  <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>{t.icon}</span>
                  <span>{t.name}</span>
                </Link>
              );
            })}
          </div>
        )}

        {/* Compare section */}
        <div className="pt-4 mt-4" style={{ borderTop: "1px solid var(--border-subtle)" }}>
          <p
            className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider"
            style={{ color: "var(--on-surface-variant)", opacity: 0.5 }}
          >
            Compare
          </p>
          <Link
            href="/compare"
            onClick={onClose}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors rounded-lg text-left"
            style={
              pathname.startsWith("/compare")
                ? {
                    color: "var(--primary)",
                    backgroundColor: "var(--nav-active-bg)",
                    fontWeight: 600,
                    borderRight: "3px solid var(--primary)",
                    borderRadius: "0.375rem 0 0 0.375rem",
                  }
                : { color: "var(--on-surface-variant)" }
            }
            onMouseEnter={(e) => {
              if (!pathname.startsWith("/compare")) {
                e.currentTarget.style.backgroundColor = "var(--surface-container)";
                e.currentTarget.style.color = "var(--foreground)";
              }
            }}
            onMouseLeave={(e) => {
              if (!pathname.startsWith("/compare")) {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "var(--on-surface-variant)";
              }
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
              electric_car
            </span>
            <span>Find Your EV</span>
          </Link>
        </div>

        {/* Export */}
        <div className="pt-4 mt-4 relative" style={{ borderTop: "1px solid var(--border-subtle)" }} ref={exportRef}>
          {exportOpen && (
            <div
              className="absolute bottom-full mb-2 left-0 right-0 rounded-lg overflow-hidden shadow-lg"
              style={{ backgroundColor: "var(--surface-container)", border: "1px solid var(--border-subtle)" }}
            >
              <button
                onClick={() => { handleExport("csv"); setExportOpen(false); }}
                className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-medium text-left"
                style={{ color: "var(--on-surface-variant)", borderBottom: "1px solid var(--border-subtle)" }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--surface-container-high)"; e.currentTarget.style.color = "var(--foreground)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "var(--on-surface-variant)"; }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>table</span>
                Export as CSV
              </button>
              <button
                onClick={() => { handleExport("pdf"); setExportOpen(false); }}
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
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors rounded-lg text-left"
            style={{ color: "var(--on-surface-variant)" }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--surface-container)"; e.currentTarget.style.color = "var(--foreground)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "var(--on-surface-variant)"; }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>file_download</span>
            <span>Export Dataset</span>
          </button>
        </div>

        {/* Attribution */}
        <div className="pt-4 mt-4 px-3" style={{ borderTop: "1px solid var(--border-subtle)" }}>
          <p className="text-xs" style={{ color: "var(--on-surface-variant)", opacity: 0.5 }}>
            Data by{" "}
            <a
              href="https://docs.google.com/spreadsheets/d/1V6ucyFGKWuSQzvI8lMzvvWJHrBS82echMVJH37kwgjE/edit?gid=244400016#gid=244400016"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2"
              style={{ color: "var(--on-surface-variant)" }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = ""; }}
            >
              Bjørn Nyland
            </a>
          </p>
        </div>
      </nav>
    </aside>
  );
}
