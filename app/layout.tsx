"use client";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: 1,
      },
    },
  }));

  return (
    <html lang="en" className="dark">
      <head>
        <title>IOTA To-Do</title>
        <meta name="description" content="Jira-powered task management for IOTA Technologies" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="mesh-bg min-h-screen">
        <SessionProvider>
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
