"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Settings, BarChart3, MessageSquare, Send, CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react"
import { WhatsAppConfiguracao } from "@/components/whatsapp-configuracao"
import { WhatsAppRelatorios } from "@/components/whatsapp-relatorios"

export default function WhatsAppAprovacoesPage() {
  const [activeTab, setActiveTab] = useState("configuracoes")

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">WhatsApp - Aprovações</h1>
        <p className="text-gray-600 mt-2">
          Configure e monitore o envio de mensagens WhatsApp para aprovação de horas extras
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="configuracoes" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Configurações
          </TabsTrigger>
          <TabsTrigger value="relatorios" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Relatórios e Logs
          </TabsTrigger>
        </TabsList>

        {/* Tab: Configurações */}
        <TabsContent value="configuracoes" className="!mt-0 !p-0">
          <WhatsAppConfiguracao />
        </TabsContent>

        {/* Tab: Relatórios */}
        <TabsContent value="relatorios" className="!mt-0 !p-0">
          <WhatsAppRelatorios />
        </TabsContent>
      </Tabs>
    </div>
  )
}

