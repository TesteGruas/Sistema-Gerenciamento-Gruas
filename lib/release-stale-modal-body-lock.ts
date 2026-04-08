/**
 * Radix Dialog usa `react-remove-scroll`, que aplica `pointer-events: none` no `document.body`.
 * Com várias instâncias de `<Dialog>` montadas (ex.: vários modais na mesma página), o desbloqueio
 * pode falhar ao fechar — a página fica “travada”. Esta rotina só remove o estilo se não houver
 * outro modal Radix ainda aberto.
 */
export function scheduleReleaseStaleBodyPointerLock(): void {
  if (typeof document === "undefined") return
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const openModal = document.querySelector(
        '[role="dialog"][data-state="open"],[role="alertdialog"][data-state="open"]',
      )
      if (!openModal) {
        document.body.style.removeProperty("pointer-events")
      }
    })
  })
}
