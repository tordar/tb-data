"use client";

import { useState, useMemo } from "react";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Sidebar } from "@/components/Sidebar";
import { getTests } from "@/lib/data/tests";

const testMeta = getTests();

function getPageTitle(pathname: string): string {
  if (pathname === "/") return "Dashboard";
  if (pathname === "/compare") return "Find Your EV";
  if (pathname.startsWith("/compare/")) return "Head-to-Head";
  if (pathname.startsWith("/vehicles/")) {
    const slug = pathname.split("/vehicles/")[1];
    // Convert slug back to readable name
    return slug
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }
  if (pathname.startsWith("/tests/")) {
    const slug = pathname.split("/tests/")[1];
    const meta = testMeta.find((t) => t.slug === slug);
    return meta?.name ?? slug;
  }
  return "";
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const pageTitle = useMemo(() => getPageTitle(pathname), [pathname]);

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: "var(--background)", color: "var(--foreground)" }}>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ backgroundColor: "rgba(0,0,0,0.15)" }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar
        pathname={pathname}
        sidebarOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        resolvedTheme={resolvedTheme}
        onThemeToggle={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      />

      <main className="flex-1 lg:ml-64 flex flex-col min-h-screen min-w-0 overflow-hidden">
        {/* Sticky mobile header */}
        <div
          className="lg:hidden sticky top-0 z-30 flex items-center gap-3 px-4 py-3"
          style={{
            backgroundColor: "var(--background)",
            borderBottom: "1px solid var(--border-subtle)",
          }}
        >
          <button
            className="p-1.5 rounded-lg shrink-0"
            style={{ color: "var(--on-surface-variant)" }}
            onClick={() => setSidebarOpen(true)}
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          <span
            className="font-bold text-sm truncate"
            style={{ color: "var(--foreground)" }}
          >
            {pageTitle}
          </span>
        </div>

        <div className="flex-1 p-6 lg:p-10 space-y-8">
          {children}
        </div>
      </main>
    </div>
  );
}
