'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { 
  Loader2, 
  Save, 
  Mail, 
  Send, 
  Eye, 
  Settings, 
  FileText, 
  BarChart3,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle
} from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import api from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

interface EmailConfig {
  smtp_host: string
  smtp_port: number
  smtp_secure: boolean
  smtp_user: string
  smtp_pass: string
  email_from: string
  email_from_name: string
  email_enabled: boolean
}

interface EmailTemplate {
  id: number
  tipo: string
  nome: string
  assunto: string
  html_template: string
  variaveis: string[]
  ativo: boolean
  updated_at: string
}

interface EmailLog {
  id: number
  tipo: string
  destinatario: string
  assunto: string
  status: string
  erro: string | null
  tentativas: number
  enviado_em: string | null
  created_at: string
}

interface EmailStats {
  total_enviados: number
  total_falhas: number
  taxa_sucesso: number
  por_tipo: Record<string, number>
}

export default function EmailConfigPage() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('config')

  // Config state
  const [config, setConfig] = useState<Partial<EmailConfig>>({})
  const [loadingConfig, setLoadingConfig] = useState(true)
  const [savingConfig, setSavingConfig] = useState(false)

  // Templates state
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null)
  const [loadingTemplates, setLoadingTemplates] = useState(false)
  const [savingTemplate, setSavingTemplate] = useState(false)

  // Test email state
  const [testEmail, setTestEmail] = useState('')
  const [testType, setTestType] = useState('welcome')
  const [sendingTest, setSendingTest] = useState(false)

  // Logs state
  const [logs, setLogs] = useState<EmailLog[]>([])
  const [loadingLogs, setLoadingLogs] = useState(false)
  const [logsPage, setLogsPage] = useState(1)
  const [logsTotalPages, setLogsTotalPages] = useState(1)

  // Stats state
  const [stats, setStats] = useState<EmailStats | null>(null)
  const [loadingStats, setLoadingStats] = useState(false)

  // Load config
  useEffect(() => {
    loadConfig()
  }, [])

  // Load templates
  useEffect(() => {
    if (activeTab === 'templates') {
      loadTemplates()
    }
  }, [activeTab])

  // Load logs
  useEffect(() => {
    if (activeTab === 'logs') {
      loadLogs()
    }
  }, [activeTab, logsPage])

  // Load stats
  useEffect(() => {
    if (activeTab === 'stats') {
      loadStats()
    }
  }, [activeTab])

  const loadConfig = async () => {
    try {
      const response = await api.get('/email-config')
      setConfig(response.data.data)
    } catch (error: any) {
      console.error('Erro ao carregar configurações:', error)
      if (error.response?.status !== 404) {
        toast({
          title: 'Erro',
          description: 'Erro ao carregar configurações',
          variant: 'destructive'
        })
      }
    } finally {
      setLoadingConfig(false)
    }
  }

  const saveConfig = async () => {
    setSavingConfig(true)
    try {
      // Garantir que todos os campos obrigatórios estejam presentes
      const configData = {
        smtp_host: config.smtp_host || '',
        smtp_port: config.smtp_port || 2525,
        smtp_secure: config.smtp_secure ?? false,
        smtp_user: config.smtp_user || '',
        smtp_pass: config.smtp_pass || '',
        email_from: config.email_from || '',
        email_from_name: config.email_from_name || '',
        email_enabled: config.email_enabled ?? true
      }
      
      await api.put('/email-config', configData)
      toast({
        title: 'Sucesso!',
        description: 'Configurações salvas com sucesso',
      })
      loadConfig()
    } catch (error: any) {
      console.error('Erro ao salvar:', error)
      toast({
        title: 'Erro',
        description: error.response?.data?.error || error.response?.data?.details || 'Erro ao salvar configurações',
        variant: 'destructive'
      })
    } finally {
      setSavingConfig(false)
    }
  }

  const loadTemplates = async () => {
    setLoadingTemplates(true)
    try {
      const response = await api.get('/email-config/templates')
      setTemplates(response.data.data)
      if (response.data.data.length > 0) {
        setSelectedTemplate(response.data.data[0])
      }
    } catch (error: any) {
      console.error('Erro ao carregar templates:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao carregar templates',
        variant: 'destructive'
      })
    } finally {
      setLoadingTemplates(false)
    }
  }

  const saveTemplate = async () => {
    if (!selectedTemplate) return

    setSavingTemplate(true)
    try {
      await api.put(`/email-config/templates/${selectedTemplate.tipo}`, {
        assunto: selectedTemplate.assunto,
        html_template: selectedTemplate.html_template,
        ativo: selectedTemplate.ativo
      })
      toast({
        title: 'Sucesso!',
        description: 'Template atualizado com sucesso',
      })
      loadTemplates()
    } catch (error: any) {
      console.error('Erro ao salvar template:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao salvar template',
        variant: 'destructive'
      })
    } finally {
      setSavingTemplate(false)
    }
  }

  const sendTestEmail = async () => {
    if (!testEmail) {
      toast({
        title: 'Erro',
        description: 'Informe um email para teste',
        variant: 'destructive'
      })
      return
    }

    setSendingTest(true)
    try {
      await api.post('/email-config/test', {
        tipo: testType,
        destinatario: testEmail,
        dados_teste: {
          nome: 'Usuário Teste',
          senha_temporaria: 'Teste@123'
        }
      })
      toast({
        title: 'Sucesso!',
        description: `Email de teste enviado para ${testEmail}`,
      })
      setTestEmail('')
    } catch (error: any) {
      console.error('Erro ao enviar teste:', error)
      toast({
        title: 'Erro',
        description: error.response?.data?.error || 'Erro ao enviar email de teste',
        variant: 'destructive'
      })
    } finally {
      setSendingTest(false)
    }
  }

  const loadLogs = async () => {
    setLoadingLogs(true)
    try {
      const response = await api.get('/email-config/logs', {
        params: { page: logsPage, limit: 20 }
      })
      setLogs(response.data.data)
      setLogsTotalPages(response.data.pagination?.totalPages || 1)
    } catch (error: any) {
      console.error('Erro ao carregar logs:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao carregar histórico',
        variant: 'destructive'
      })
    } finally {
      setLoadingLogs(false)
    }
  }

  const loadStats = async () => {
    setLoadingStats(true)
    try {
      const response = await api.get('/email-config/stats', {
        params: { periodo: 30 }
      })
      setStats(response.data.data)
    } catch (error: any) {
      console.error('Erro ao carregar estatísticas:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao carregar estatísticas',
        variant: 'destructive'
      })
    } finally {
      setLoadingStats(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'enviado':
        return <Badge className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" />Enviado</Badge>
      case 'falha':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Falha</Badge>
      case 'pendente':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const getTipoBadge = (tipo: string) => {
    const tipos: Record<string, { label: string; color: string }> = {
      welcome: { label: 'Boas-vindas', color: 'bg-blue-500' },
      reset_password: { label: 'Redefinição', color: 'bg-orange-500' },
      password_changed: { label: 'Senha Alterada', color: 'bg-green-500' },
      test: { label: 'Teste', color: 'bg-purple-500' },
      custom: { label: 'Personalizado', color: 'bg-gray-500' }
    }
    const config = tipos[tipo] || tipos.custom
    return <Badge className={config.color}>{config.label}</Badge>
  }

  if (loadingConfig) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="w-full h-full p-6 space-y-6 overflow-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Configuração de Emails</h1>
          <p className="text-muted-foreground">
            Gerencie as configurações de envio de emails do sistema
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="config">
            <Settings className="h-4 w-4 mr-2" />
            Configurações
          </TabsTrigger>
          <TabsTrigger value="templates">
            <FileText className="h-4 w-4 mr-2" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="logs">
            <Mail className="h-4 w-4 mr-2" />
            Histórico
          </TabsTrigger>
          <TabsTrigger value="stats">
            <BarChart3 className="h-4 w-4 mr-2" />
            Estatísticas
          </TabsTrigger>
        </TabsList>

        {/* TAB: Configurações SMTP */}
        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações SMTP</CardTitle>
              <CardDescription>
                Configure as credenciais do servidor de email. Recomendamos usar Mailtrap para desenvolvimento.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  As credenciais são criptografadas com AES-256 antes de serem armazenadas no banco de dados.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtp_host">Host SMTP</Label>
                  <Input
                    id="smtp_host"
                    placeholder="sandbox.smtp.mailtrap.io"
                    value={config.smtp_host || ''}
                    onChange={(e) => setConfig({ ...config, smtp_host: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="smtp_port">Porta</Label>
                  <Input
                    id="smtp_port"
                    type="number"
                    placeholder="2525"
                    value={config.smtp_port || ''}
                    onChange={(e) => setConfig({ ...config, smtp_port: parseInt(e.target.value) })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Mailtrap: 2525, 587 (sem SSL) ou 465 (com SSL)
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="smtp_secure"
                    checked={config.smtp_secure || false}
                    onCheckedChange={(checked) => setConfig({ ...config, smtp_secure: checked })}
                  />
                  <Label htmlFor="smtp_secure">Usar SSL/TLS</Label>
                </div>
                <Alert className="mt-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    <strong>Mailtrap:</strong> Use SSL/TLS <strong>desligado</strong> para portas 2525 e 587. Use SSL/TLS <strong>ligado</strong> apenas para porta 465.
                  </AlertDescription>
                </Alert>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtp_user">Usuário SMTP</Label>
                  <Input
                    id="smtp_user"
                    placeholder="username"
                    value={config.smtp_user || ''}
                    onChange={(e) => setConfig({ ...config, smtp_user: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="smtp_pass">Senha SMTP</Label>
                  <Input
                    id="smtp_pass"
                    type="password"
                    placeholder="password"
                    value={config.smtp_pass || ''}
                    onChange={(e) => setConfig({ ...config, smtp_pass: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email_from">Email Remetente</Label>
                  <Input
                    id="email_from"
                    type="email"
                    placeholder="noreply@sistema-gruas.com"
                    value={config.email_from || ''}
                    onChange={(e) => setConfig({ ...config, email_from: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email_from_name">Nome do Remetente</Label>
                  <Input
                    id="email_from_name"
                    placeholder="Sistema de Gruas"
                    value={config.email_from_name || ''}
                    onChange={(e) => setConfig({ ...config, email_from_name: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="email_enabled"
                  checked={config.email_enabled ?? true}
                  onCheckedChange={(checked) => setConfig({ ...config, email_enabled: checked })}
                />
                <Label htmlFor="email_enabled">Envio de Emails Habilitado</Label>
              </div>

              <div className="flex gap-2">
                <Button onClick={saveConfig} disabled={savingConfig}>
                  {savingConfig ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvando...</>
                  ) : (
                    <><Save className="mr-2 h-4 w-4" />Salvar Configurações</>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Test Email Card */}
          <Card>
            <CardHeader>
              <CardTitle>Testar Envio de Email</CardTitle>
              <CardDescription>
                Envie um email de teste para verificar se as configurações estão corretas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="test_type">Tipo de Email</Label>
                  <Select value={testType} onValueChange={setTestType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="welcome">Boas-vindas</SelectItem>
                      <SelectItem value="reset_password">Redefinição de Senha</SelectItem>
                      <SelectItem value="password_changed">Senha Alterada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="test_email">Email de Destino</Label>
                  <Input
                    id="test_email"
                    type="email"
                    placeholder="seu@email.com"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                  />
                </div>
              </div>

              <Button onClick={sendTestEmail} disabled={sendingTest || !testEmail}>
                {sendingTest ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enviando...</>
                ) : (
                  <><Send className="mr-2 h-4 w-4" />Enviar Email de Teste</>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: Templates */}
        <TabsContent value="templates" className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {/* Lista de templates */}
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Templates Disponíveis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {loadingTemplates ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  templates.map((template) => (
                    <Button
                      key={template.id}
                      variant={selectedTemplate?.id === template.id ? 'default' : 'outline'}
                      className="w-full justify-start"
                      onClick={() => setSelectedTemplate(template)}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      {template.nome}
                    </Button>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Editor de template */}
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>
                  {selectedTemplate?.nome || 'Selecione um template'}
                </CardTitle>
                <CardDescription>
                  Variáveis disponíveis: {selectedTemplate?.variaveis.join(', ')}
                </CardDescription>
              </CardHeader>
              {selectedTemplate && (
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="assunto">Assunto do Email</Label>
                    <Input
                      id="assunto"
                      value={selectedTemplate.assunto}
                      onChange={(e) => setSelectedTemplate({
                        ...selectedTemplate,
                        assunto: e.target.value
                      })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="html_template">Template HTML</Label>
                    <Textarea
                      id="html_template"
                      rows={12}
                      className="font-mono text-xs"
                      value={selectedTemplate.html_template}
                      onChange={(e) => setSelectedTemplate({
                        ...selectedTemplate,
                        html_template: e.target.value
                      })}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="ativo"
                      checked={selectedTemplate.ativo}
                      onCheckedChange={(checked) => setSelectedTemplate({
                        ...selectedTemplate,
                        ativo: checked
                      })}
                    />
                    <Label htmlFor="ativo">Template Ativo</Label>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={saveTemplate} disabled={savingTemplate}>
                      {savingTemplate ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvando...</>
                      ) : (
                        <><Save className="mr-2 h-4 w-4" />Salvar Template</>
                      )}
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        </TabsContent>

        {/* TAB: Histórico */}
        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Emails Enviados</CardTitle>
              <CardDescription>
                Últimos emails enviados pelo sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingLogs ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Destinatário</TableHead>
                        <TableHead>Assunto</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Tentativas</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground">
                            Nenhum email enviado ainda
                          </TableCell>
                        </TableRow>
                      ) : (
                        logs.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell className="text-xs">
                              {new Date(log.created_at).toLocaleString('pt-BR')}
                            </TableCell>
                            <TableCell>{getTipoBadge(log.tipo)}</TableCell>
                            <TableCell className="font-mono text-xs">{log.destinatario}</TableCell>
                            <TableCell className="text-sm">{log.assunto}</TableCell>
                            <TableCell>{getStatusBadge(log.status)}</TableCell>
                            <TableCell>{log.tentativas}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>

                  {/* Paginação */}
                  {logsTotalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setLogsPage(p => Math.max(1, p - 1))}
                        disabled={logsPage === 1}
                      >
                        Anterior
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        Página {logsPage} de {logsTotalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setLogsPage(p => Math.min(logsTotalPages, p + 1))}
                        disabled={logsPage === logsTotalPages}
                      >
                        Próxima
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: Estatísticas */}
        <TabsContent value="stats" className="space-y-4">
          {loadingStats ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : stats ? (
            <>
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total Enviados
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600">
                      {stats.total_enviados}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total Falhas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-red-600">
                      {stats.total_falhas}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Taxa de Sucesso
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-600">
                      {stats.taxa_sucesso}%
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Gráficos Visuais */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Gráfico de Pizza - Taxa de Sucesso */}
                <Card>
                  <CardHeader>
                    <CardTitle>Taxa de Sucesso vs Falhas</CardTitle>
                    <CardDescription>
                      Distribuição de emails enviados nos últimos 30 dias
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Enviados', value: stats.total_enviados, color: '#10b981' },
                            { name: 'Falhas', value: stats.total_falhas, color: '#ef4444' }
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {[
                            { name: 'Enviados', value: stats.total_enviados, color: '#10b981' },
                            { name: 'Falhas', value: stats.total_falhas, color: '#ef4444' }
                          ].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip 
                          formatter={(value: number) => [`${value} emails`, '']}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Gráfico de Barras - Emails por Tipo */}
                <Card>
                  <CardHeader>
                    <CardTitle>Emails por Tipo</CardTitle>
                    <CardDescription>
                      Quantidade de emails enviados por tipo nos últimos 30 dias
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {Object.keys(stats.por_tipo).length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart 
                          data={Object.entries(stats.por_tipo).map(([tipo, count]) => ({
                            tipo: tipo === 'welcome' ? 'Boas-vindas' : 
                                  tipo === 'reset_password' ? 'Redefinição' :
                                  tipo === 'password_changed' ? 'Senha Alterada' :
                                  tipo === 'test' ? 'Teste' : 'Personalizado',
                            quantidade: count
                          }))}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="tipo" />
                          <YAxis />
                          <RechartsTooltip 
                            formatter={(value: number) => [`${value} emails`, 'Quantidade']}
                          />
                          <Legend />
                          <Bar dataKey="quantidade" fill="#3b82f6" name="Emails Enviados" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                        <div className="text-center">
                          <Mail className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                          <p>Nenhum email enviado nos últimos 30 dias</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Lista de Emails por Tipo (mantida para referência) */}
              <Card>
                <CardHeader>
                  <CardTitle>Detalhamento por Tipo</CardTitle>
                  <CardDescription>
                    Últimos 30 dias
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(stats.por_tipo).map(([tipo, count]) => (
                      <div key={tipo} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getTipoBadge(tipo)}
                        </div>
                        <span className="font-semibold">{count}</span>
                      </div>
                    ))}
                    {Object.keys(stats.por_tipo).length === 0 && (
                      <p className="text-center text-muted-foreground">
                        Nenhum email enviado nos últimos 30 dias
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                Nenhuma estatística disponível
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

