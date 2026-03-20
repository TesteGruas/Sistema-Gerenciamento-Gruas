"use client"

import { useEffect, useMemo } from "react"
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

/** Ícones padrão do Leaflet quebram no bundler do Next — usar CDN estável */
const setupLeafletDefaultIcons = () => {
  if (typeof window === "undefined") return
  delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: string })._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  })
}

const markerUsuario = L.divIcon({
  className: "pwa-ponto-marker",
  html: `<div style="width:18px;height:18px;border-radius:50%;background:#2563eb;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.35)"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
  popupAnchor: [0, -9],
})

const markerObra = L.divIcon({
  className: "pwa-ponto-marker",
  html: `<div style="width:18px;height:18px;border-radius:50%;background:#ea580c;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.35)"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
  popupAnchor: [0, -9],
})

/** Após dynamic import / layout, o Leaflet mede 0×0; sem isso o mapa fica em branco */
function InvalidarTamanhoAoMontar() {
  const map = useMap()
  useEffect(() => {
    const fix = () => {
      map.invalidateSize({ animate: false })
    }
    fix()
    const t1 = window.setTimeout(fix, 50)
    const t2 = window.setTimeout(fix, 300)
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(fix) : null
    if (ro && map.getContainer()) {
      ro.observe(map.getContainer())
    }
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      ro?.disconnect()
    }
  }, [map])
  return null
}

function AjustarVisao({
  usuario,
  obra,
}: {
  usuario: { lat: number; lng: number } | null
  obra: { lat: number; lng: number } | null
}) {
  const map = useMap()

  useEffect(() => {
    setupLeafletDefaultIcons()
  }, [])

  useEffect(() => {
    if (!map) return

    if (usuario && obra) {
      const dLat = Math.abs(usuario.lat - obra.lat)
      const dLng = Math.abs(usuario.lng - obra.lng)
      if (dLat < 1e-6 && dLng < 1e-6) {
        map.setView([usuario.lat, usuario.lng], 17)
        return
      }
      const bounds = L.latLngBounds(
        [usuario.lat, usuario.lng],
        [obra.lat, obra.lng]
      )
      map.fitBounds(bounds, { padding: [36, 36], maxZoom: 17 })
      window.setTimeout(() => map.invalidateSize({ animate: false }), 0)
      return
    }

    if (usuario) {
      map.setView([usuario.lat, usuario.lng], 16)
      window.setTimeout(() => map.invalidateSize({ animate: false }), 0)
      return
    }

    if (obra) {
      map.setView([obra.lat, obra.lng], 16)
      window.setTimeout(() => map.invalidateSize({ animate: false }), 0)
    }
  }, [map, usuario, obra])

  return null
}

export type PontoMapaInnerProps = {
  usuario: { lat: number; lng: number; endereco?: string } | null
  obra: {
    lat: number
    lng: number
    nome: string
    enderecoTexto: string
  } | null
  /** Raio da obra em metros (círculo semi-transparente) */
  raioObraMetros?: number
  className?: string
}

export default function PontoMapaInner({
  usuario,
  obra,
  raioObraMetros = 5000,
  className = "",
}: PontoMapaInnerProps) {
  const centroInicial = useMemo(() => {
    if (usuario) return [usuario.lat, usuario.lng] as [number, number]
    if (obra) return [obra.lat, obra.lng] as [number, number]
    return [-14.235, -51.9253] as [number, number] // centro BR fallback
  }, [usuario, obra])

  const zoomInicial = usuario || obra ? 15 : 4

  if (!usuario && !obra) {
    return (
      <div
        className={`flex h-[220px] items-center justify-center rounded-lg border border-dashed bg-muted/40 text-center text-sm text-muted-foreground ${className}`}
      >
        Ative o GPS e aguarde a obra com coordenadas para ver o mapa.
      </div>
    )
  }

  return (
    <div
      className={`relative z-[1] min-h-[220px] w-full overflow-hidden rounded-lg border bg-muted/20 ${className}`}
      style={{ minHeight: 220 }}
    >
      <MapContainer
        center={centroInicial}
        zoom={zoomInicial}
        className="z-[1] h-[220px] w-full"
        style={{ height: 220, width: "100%" }}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <InvalidarTamanhoAoMontar />
        <AjustarVisao
          usuario={usuario ? { lat: usuario.lat, lng: usuario.lng } : null}
          obra={obra ? { lat: obra.lat, lng: obra.lng } : null}
        />

        {obra && raioObraMetros > 0 && (
          <Circle
            center={[obra.lat, obra.lng]}
            radius={raioObraMetros}
            pathOptions={{
              color: "#16a34a",
              weight: 2,
              fillColor: "#22c55e",
              fillOpacity: 0.12,
            }}
          />
        )}

        {usuario && (
          <Marker position={[usuario.lat, usuario.lng]} icon={markerUsuario}>
            <Popup>
              <div className="text-sm font-semibold">Você (GPS)</div>
              <div className="max-w-[220px] text-xs text-muted-foreground">
                {usuario.endereco?.trim()
                  ? usuario.endereco
                  : `${usuario.lat.toFixed(6)}, ${usuario.lng.toFixed(6)}`}
              </div>
            </Popup>
          </Marker>
        )}

        {obra && (
          <Marker position={[obra.lat, obra.lng]} icon={markerObra}>
            <Popup>
              <div className="text-sm font-semibold">Obra: {obra.nome}</div>
              <div className="max-w-[220px] text-xs text-muted-foreground">
                {obra.enderecoTexto || `${obra.lat.toFixed(6)}, ${obra.lng.toFixed(6)}`}
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  )
}
