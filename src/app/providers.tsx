"use client";

import { ThemeProvider } from "next-themes";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem scriptProps={{ "data-cfasync": "false" }}>
      {children}
    </ThemeProvider>
  );
}
