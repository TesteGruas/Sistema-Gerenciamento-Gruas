import { Suspense } from "react"

export default function NotasFiscaisLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center p-6 text-sm text-muted-foreground">
          Carregando notas fiscais…
        </div>
      }
    >
      {children}
    </Suspense>
  )
}
