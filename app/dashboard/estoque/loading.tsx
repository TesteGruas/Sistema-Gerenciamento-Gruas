import { PageLoader } from "@/components/ui/loader"

export default function Loading() {
  // Loading otimizado - só aparece se a navegação demorar mais que 200ms
  return <PageLoader text="Carregando estoque..." />
}
