"use client"

import dynamic from "next/dynamic"
import type { PontoMapaInnerProps } from "./pwa-ponto-mapa-inner"

const PontoMapaInner = dynamic(() => import("./pwa-ponto-mapa-inner"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[220px] w-full items-center justify-center rounded-lg border bg-muted/30 text-sm text-muted-foreground">
      Carregando mapa…
    </div>
  ),
})

export type PontoMapaProps = PontoMapaInnerProps

/**
 * Mapa OpenStreetMap (Leaflet) com marcadores para posição do usuário e da obra.
 * Carregamento apenas no cliente (Leaflet não suporta SSR).
 */
export function PontoMapa(props: PontoMapaProps) {
  return <PontoMapaInner {...props} />
}
