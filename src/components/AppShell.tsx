"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Sidebar } from "@/components/Sidebar";
import { AppHeader } from "@/components/AppHeader";

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
      />

      <main className="flex-1 lg:ml-64 flex flex-col min-h-screen min-w-0 overflow-hidden">
        <AppHeader
          resolvedTheme={resolvedTheme}
          onThemeToggle={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          onMenuOpen={() => setSidebarOpen(true)}
        />

        <div className="mt-16 flex-1 p-6 lg:p-10 space-y-8">
          {children}
        </div>
      </main>
    </div>
  );
}
