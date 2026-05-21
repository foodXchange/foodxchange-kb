"use client";

import { MantineProvider } from "@mantine/core";
import { ThemeProvider } from "next-themes";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class">
      <MantineProvider>{children}</MantineProvider>
    </ThemeProvider>
  );
}
