"use client"

import { TemplatesEmailSidebar } from "@/components/templates-email-nav"

export default function TemplatesEmailLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-6rem)] w-full">
      <TemplatesEmailSidebar />
      <div className="flex-1 min-w-0 bg-gradient-to-b from-background via-background to-muted/30">
        {children}
      </div>
    </div>
  )
}
