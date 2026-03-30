"use client";

interface AppHeaderProps {
  resolvedTheme: string | undefined;
  onThemeToggle: () => void;
  onMenuOpen: () => void;
}

export function AppHeader({
  resolvedTheme,
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
      </div>
    </header>
  );
}
