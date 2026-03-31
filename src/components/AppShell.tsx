"use client";

import { useState, useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Sidebar } from "@/components/Sidebar";
import { getTests } from "@/lib/data/tests";

const testMeta = getTests();

function getPageInfo(pathname: string): { title: string; icon: string } {
  if (pathname === "/") return { title: "Dashboard", icon: "dashboard" };
  if (pathname === "/compare") return { title: "Find Your EV", icon: "tune" };
  if (pathname.startsWith("/compare/")) return { title: "Head-to-Head", icon: "compare_arrows" };
  if (pathname.startsWith("/vehicles/")) {
    const slug = pathname.split("/vehicles/")[1];
    return {
      title: slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      icon: "directions_car",
    };
  }
  if (pathname.startsWith("/tests/")) {
    const slug = pathname.split("/tests/")[1];
    const meta = testMeta.find((t) => t.slug === slug);
    return { title: meta?.name ?? slug, icon: meta?.icon ?? "table_chart" };
  }
  return { title: "", icon: "" };
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [scrolledPastTitle, setScrolledPastTitle] = useState(false);
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const pageInfo = useMemo(() => getPageInfo(pathname), [pathname]);

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [sidebarOpen]);

  // Watch for the page headline scrolling out of view
  useEffect(() => {
    setScrolledPastTitle(false);

    const observer = new IntersectionObserver(
      ([entry]) => setScrolledPastTitle(!entry.isIntersecting),
      { threshold: 0 }
    );

    // Small delay to let the page render the headline
    const timer = setTimeout(() => {
      const headline = document.querySelector("[data-page-headline]");
      if (headline) observer.observe(headline);
    }, 50);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [pathname]);

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

      <main className="flex-1 lg:ml-64 flex flex-col min-h-screen min-w-0">
        {/* Sticky mobile header */}
        <div
          className="lg:hidden sticky top-0 z-30 flex items-center gap-2 px-4 py-3"
          style={{
            backgroundColor: "var(--background)",
            borderBottom: scrolledPastTitle ? "1px solid var(--border-subtle)" : "1px solid transparent",
          }}
        >
          <button
            className="p-1.5 rounded-lg shrink-0"
            style={{ color: "var(--on-surface-variant)" }}
            onClick={() => setSidebarOpen(true)}
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          <div
            className="flex items-center gap-2 truncate transition-opacity duration-200"
            style={{ opacity: scrolledPastTitle ? 1 : 0 }}
          >
            {pageInfo.icon && (
              <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "var(--primary)" }}>
                {pageInfo.icon}
              </span>
            )}
            <span className="font-bold text-sm truncate" style={{ color: "var(--foreground)" }}>
              {pageInfo.title}
            </span>
          </div>
        </div>

        <div className="flex-1 p-6 lg:p-10 space-y-8">
          {children}
        </div>
      </main>
    </div>
  );
}
