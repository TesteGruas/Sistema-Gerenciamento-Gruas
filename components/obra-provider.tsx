"use client"

import { ObraProvider } from "@/lib/obra-context"

export function ObraProviderWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ObraProvider>
      {children}
    </ObraProvider>
  )
}
