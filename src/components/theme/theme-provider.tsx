import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ReactNode } from "react";

/**
 * App-wide theme provider.
 * - `class` strategy pairs with tailwind's `darkMode: ["class"]`.
 * - Defaults to the OS preference, user choice persisted in localStorage.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      storageKey="core-ledger-theme"
    >
      {children}
    </NextThemesProvider>
  );
}
