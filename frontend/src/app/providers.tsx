"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { useState, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useAppStore();

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "light") {
      root.classList.remove("dark");
      root.classList.add("light");
      document.body.style.backgroundColor = "#F3F4F6";
      document.body.style.color = "#111827";
    } else {
      root.classList.remove("light");
      root.classList.add("dark");
      document.body.style.backgroundColor = "#0D0D14";
      document.body.style.color = "#E8E8F0";
    }
  }, [theme]);

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 30000, retry: 1 } },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>{children}</ThemeProvider>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "#1A1A26",
            border: "1px solid #2A2A3E",
            color: "#E8E8F0",
          },
          success: { iconTheme: { primary: "#00F5A0", secondary: "#1A1A26" } },
        }}
      />
    </QueryClientProvider>
  );
}
