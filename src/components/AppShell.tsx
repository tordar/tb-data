"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Sidebar } from "@/components/Sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();

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
        {/* Mobile menu button */}
        <div className="lg:hidden flex items-center px-6 py-4">
          <button
            className="p-1.5 rounded-lg"
            style={{ color: "var(--on-surface-variant)" }}
            onClick={() => setSidebarOpen(true)}
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
        </div>

        <div className="flex-1 p-6 lg:p-10 space-y-8">
          {children}
        </div>
      </main>
    </div>
  );
}
