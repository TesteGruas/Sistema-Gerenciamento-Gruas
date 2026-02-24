"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function BoletosPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/dashboard/financeiro/notas-fiscais")
  }, [router])

  return null
}
