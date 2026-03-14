"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { WagmiProvider } from "wagmi";
import { wagmiConfig } from "../lib/wagmi-config";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

const queryClient = new QueryClient();

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </WagmiProvider>
    </ClerkProvider>
  );
}
