/**
 * Catálogo de e-mails do sistema (espelha o uso no backend).
 * Usado na aba "Onde é usado" em Configurações → Templates de e-mail.
 */

export type EmailTemplateCatalogItem = {
  /** Identificador do template no banco (email_templates.tipo) ou log (email_logs.tipo) */
  tipo: string
  /** Nome amigável */
  nome: string
  /** Área funcional */
  categoria: "conta" | "medicao" | "ponto" | "sistema"
  /** Quando dispara */
  gatilho: string
  /** Rotas / arquivos principais */
  onde: string[]
  /** Se o HTML/assunto vêm de email_templates (editável no painel) */
  editavelNoPainel: boolean
}

export const EMAIL_TEMPLATES_CATALOG: EmailTemplateCatalogItem[] = [
  {
    tipo: "welcome",
    nome: "Boas-vindas com senha temporária",
    categoria: "conta",
    gatilho:
      "Mesmo modelo para: novo funcionário, novo cliente, convite ligado a obra (ex.: nova obra / responsável) e usuário interno — sempre que o sistema envia login e senha provisória.",
    onde: [
      "backend-api/src/routes/clientes.js",
      "backend-api/src/routes/funcionarios.js",
      "backend-api/src/routes/obras.js (inclui fluxos de obra / vínculos)",
      "backend-api/src/routes/users.js",
    ],
    editavelNoPainel: true,
  },
  {
    tipo: "reset_password",
    nome: "Redefinição de senha (link) ou senha temporária (admin)",
    categoria: "conta",
    gatilho:
      "Fluxo “esqueci minha senha” usa o template do banco; reset por admin usa HTML fixo no serviço de e-mail.",
    onde: [
      "backend-api/src/routes/auth.js (sendResetPasswordEmail — template DB)",
      "backend-api/src/routes/funcionarios.js (sendPasswordResetEmail — HTML interno)",
      "backend-api/src/services/email.service.js",
    ],
    editavelNoPainel: true,
  },
  {
    tipo: "password_changed",
    nome: "Confirmação de alteração de senha",
    categoria: "conta",
    gatilho: "Após o usuário alterar a senha com sucesso.",
    onde: ["backend-api/src/routes/auth.js", "backend-api/src/services/email.service.js"],
    editavelNoPainel: true,
  },
  {
    tipo: "medicao_enviada",
    nome: "Medição mensal enviada ao cliente",
    categoria: "medicao",
    gatilho:
      "Envio da medição (PDF/link público) ao e-mail do cliente quando a medição é enviada.",
    onde: [
      "backend-api/src/routes/medicoes-mensais.js",
      "backend-api/src/services/email.service.js (buildMedicaoClienteEmail)",
    ],
    editavelNoPainel: true,
  },
  {
    tipo: "notificacao_ponto_responsavel",
    nome: "Ponto — registro concluído (responsável da obra)",
    categoria: "ponto",
    gatilho:
      "Funcionário encerra o dia; o responsável recebe e-mail para assinar o registro.",
    onde: ["backend-api/src/utils/notificacoes-ponto.js"],
    editavelNoPainel: true,
  },
  {
    tipo: "notificacao_ponto_pendente_generica",
    nome: "Ponto — pendências de aprovação na obra",
    categoria: "ponto",
    gatilho:
      "Lembrete aos responsáveis de que existem registros aguardando assinatura.",
    onde: ["backend-api/src/utils/notificacoes-ponto.js"],
    editavelNoPainel: true,
  },
  {
    tipo: "notificacao_ponto_funcionario",
    nome: "Ponto — assinado pelo responsável (funcionário)",
    categoria: "ponto",
    gatilho:
      "O responsável assinou o ponto; o funcionário recebe e-mail para assinar também.",
    onde: ["backend-api/src/utils/notificacoes-ponto.js"],
    editavelNoPainel: true,
  },
  {
    tipo: "notificacao_ponto_rejeicao",
    nome: "Ponto — registro não aprovado / correção",
    categoria: "ponto",
    gatilho:
      "O responsável rejeitou o registro; o funcionário recebe o motivo e o link para corrigir.",
    onde: ["backend-api/src/utils/notificacoes-ponto.js"],
    editavelNoPainel: true,
  },
  {
    tipo: "test",
    nome: "E-mail de teste (configurações SMTP)",
    categoria: "sistema",
    gatilho:
      "Botão de teste nas configurações de e-mail; não usa template fixo no banco (log tipo “test”).",
    onde: ["backend-api/src/routes/email-config.js"],
    editavelNoPainel: false,
  },
]

export const EMAIL_CATALOG_CATEGORIES: Record<
  EmailTemplateCatalogItem["categoria"],
  string
> = {
  conta: "Conta e acesso",
  medicao: "Medição",
  ponto: "Ponto eletrônico",
  sistema: "Sistema / diagnóstico",
}
