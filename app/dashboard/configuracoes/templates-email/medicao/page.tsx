import { redirect } from "next/navigation"

export default function TemplateMedicaoLegacyPage() {
  redirect("/dashboard/configuracoes/templates-email/edit/medicao_enviada")
}
