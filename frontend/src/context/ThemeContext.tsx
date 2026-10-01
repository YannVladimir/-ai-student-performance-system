import { type ReactNode } from "react";

/**
 * The app is permanently light mode. This module is kept as a no-op provider
 * so existing imports don't need to change; it never adds a "dark" class to
 * the document root and never reads/writes any theme preference.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
