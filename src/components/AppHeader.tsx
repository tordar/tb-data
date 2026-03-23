"use client";

interface AppHeaderProps {
  icon: string;
  title: string;
  isDashboard: boolean;
  search: string;
  sheetName: string;
  resolvedTheme: string | undefined;
  onSearch: (v: string) => void;
  onThemeToggle: () => void;
  onMenuOpen: () => void;
}

export function AppHeader({
  icon,
  title,
  isDashboard,
  search,
  sheetName,
  resolvedTheme,
  onSearch,
  onThemeToggle,
  onMenuOpen,
}: AppHeaderProps) {
  return (
    <header
      className="fixed top-0 right-0 left-0 lg:left-64 z-40 flex items-center justify-between px-6 lg:px-10 h-16"
      style={{
        backgroundColor: "var(--header-bg)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(199,196,216,0.18)",
        boxShadow: "0 8px 32px 0 rgba(27,28,28,0.04)",
      }}
    >
      <div className="flex items-center gap-4">
        <button
          className="lg:hidden p-1.5 rounded-lg"
          style={{ color: "var(--on-surface-variant)" }}
          onClick={onMenuOpen}
        >
          <span className="material-symbols-outlined">menu</span>
        </button>

        <div className="flex items-center gap-2.5">
          <span className="material-symbols-outlined" style={{ color: "var(--primary)", fontSize: "20px" }}>
            {icon}
          </span>
          <span className="font-bold text-base tracking-tight" style={{ color: "var(--foreground)" }}>
            {title}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onThemeToggle}
          className="p-2 rounded-lg transition-colors"
          style={{ color: "var(--on-surface-variant)", backgroundColor: "var(--surface-container-low)" }}
          aria-label="Toggle dark mode"
        >
          <span className="material-symbols-outlined" style={{ fontSize: "18px" }} suppressHydrationWarning>
            {resolvedTheme === "dark" ? "light_mode" : "dark_mode"}
          </span>
        </button>
        {!isDashboard && (
          <div className="relative hidden sm:block">
            <span
              className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: "var(--on-surface-variant-muted)", fontSize: "16px" }}
            >
              search
            </span>
            <input
              type="text"
              placeholder={`Search ${sheetName}…`}
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              className="rounded-full py-2 pl-9 pr-4 text-sm w-56 transition-all outline-none"
              style={{ backgroundColor: "var(--surface-container-low)", border: "none", color: "var(--foreground)" }}
              onFocus={(e) => {
                (e.target as HTMLInputElement).style.boxShadow = "0 0 0 2px rgba(53,37,205,0.2)";
              }}
              onBlur={(e) => {
                (e.target as HTMLInputElement).style.boxShadow = "none";
              }}
            />
          </div>
        )}
      </div>
    </header>
  );
}
