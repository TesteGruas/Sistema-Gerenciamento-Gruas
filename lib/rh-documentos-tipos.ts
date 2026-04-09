/**
 * Tipos padronizados para documentos RH (admissionais, certificados, demissão).
 * Mantidos alinhados às solicitações do cliente (2026).
 */

export const TIPOS_DOCUMENTOS_ADMISSIONAIS = [
  'ASO',
  'eSocial',
  'Ficha de Registro',
  'Contrato de Trabalho',
  'Contrato de Experiência',
  'Vale Transporte',
  'Recibo Ajuda de Custo',
] as const

export type TipoDocumentoAdmissional = (typeof TIPOS_DOCUMENTOS_ADMISSIONAIS)[number]

export const TIPOS_CERTIFICADOS = [
  'NR12',
  'NR6',
  'NR06',
  'NR07',
  'NR7',
  'NR11',
  'NR18',
  'NR35',
  'Operador de Grua',
  'Sinaleiro',
  'Ficha de EPI',
  'Ordem de Serviço',
  'Certificado de Especificação',
] as const

export type TipoCertificado = (typeof TIPOS_CERTIFICADOS)[number]

/** Documentos de rescisão — lista inicial; pode ser ampliada quando enviarem a documentação oficial. */
export const TIPOS_DOCUMENTOS_DEMISSAO = [
  'Termo de Rescisão do Contrato',
  'Termo de Quitação',
  'Homologação da Rescisão',
  'Recibo de Verbas Rescisórias',
  'Comunicação de Desligamento (CD)',
  'Seguro-Desemprego (requerimento / documentos)',
  'Devolução de EPI / Crachá',
  'Outros',
] as const

export type TipoDocumentoDemissao = (typeof TIPOS_DOCUMENTOS_DEMISSAO)[number]
