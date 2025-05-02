import { createContext, useContext } from "react"

export type Theme = "dark" | "light" | "system"

export interface ThemeContextValue {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const defaultValue: ThemeContextValue = {
  theme: "dark",
  setTheme: () => {
    /* noop */
  },
}

export const ThemeContext = createContext<ThemeContextValue>(defaultValue)

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return ctx
}
