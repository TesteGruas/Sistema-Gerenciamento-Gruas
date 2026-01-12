"use client"

import React from "react"
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  PDFDownloadLink,
  Image
} from "@react-pdf/renderer"
import { format } from "date-fns"

// Registrar fonte Inter (se disponível) ou usar Helvetica como fallback
// Nota: As fontes Inter precisam estar em public/fonts/Inter/
// Por enquanto, vamos usar Helvetica padrão que já suporta acentos
// Para usar Inter, descomente o código abaixo e adicione as fontes TTF
/*
try {
  Font.register({
    family: "Inter",
    fonts: [
      { src: "/fonts/Inter/Inter-Regular.ttf", fontWeight: "normal" },
      { src: "/fonts/Inter/Inter-Medium.ttf", fontWeight: 500 },
      { src: "/fonts/Inter/Inter-Bold.ttf", fontWeight: "bold" }
    ]
  })
} catch (e) {
  console.log("Fontes Inter não encontradas, usando Helvetica padrão")
}
*/

const styles = StyleSheet.create({
  page: {
    padding: 28,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#111827"
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingBottom: 10,
    marginBottom: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start"
  },
  headerLeft: {
    flexDirection: "row",
    gap: 12,
    flex: 1
  },
  logoContainer: {
    width: 60,
    height: 60
  },
  headerInfo: {
    flex: 1
  },
  brand: { fontSize: 12, fontWeight: "bold" },
  subBrand: { fontSize: 9, color: "#6B7280" },
  docTitle: { fontSize: 12, fontWeight: "bold", textAlign: "right" },
  sectionTitle: {
    fontSize: 10,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8
  },
  grid2: { display: "flex", flexDirection: "row", gap: 12 },
  col: { flex: 1 },
  label: { fontSize: 8, color: "#6B7280", marginBottom: 2 },
  value: { fontSize: 10 },
  card: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 6,
    padding: 10,
    marginTop: 6
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6
  },
  totalBox: {
    marginTop: 8,
    padding: 10,
    borderRadius: 6,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB"
  },
  totalText: { fontSize: 10, fontWeight: "bold" },
  muted: { color: "#6B7280" },
  table: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 4
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingVertical: 6,
    paddingHorizontal: 8
  },
  tableHeader: {
    backgroundColor: "#F9FAFB",
    fontWeight: "bold",
    fontSize: 9
  },
  tableCell: {
    fontSize: 9,
    flex: 1
  },
  tableCellRight: {
    fontSize: 9,
    flex: 1,
    textAlign: "right"
  },
  footer: {
    position: "absolute",
    bottom: 18,
    left: 28,
    right: 28,
    fontSize: 8,
    color: "#6B7280",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between"
  },
  textArea: {
    marginTop: 6,
    fontSize: 9,
    lineHeight: 1.4,
    color: "#374151"
  }
})

// Helpers de formatação
const money = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n || 0)

const ptDate = (d: string | Date) => {
  try {
    const date = d instanceof Date ? d : new Date(d)
    return format(date, "dd/MM/yyyy")
  } catch {
    return d?.toString() || "-"
  }
}

const formatTitleCase = (text: string | undefined | null): string => {
  if (!text) return "-"
  
  const palavrasMinusculas = ['de', 'da', 'do', 'das', 'dos', 'em', 'e', 'a', 'o', 'para', 'com', 'por']
  
  return text
    .toLowerCase()
    .split(' ')
    .map((palavra, index) => {
      if (index === 0) {
        return palavra.charAt(0).toUpperCase() + palavra.slice(1)
      }
      if (palavrasMinusculas.includes(palavra)) {
        return palavra
      }
      return palavra.charAt(0).toUpperCase() + palavra.slice(1)
    })
    .join(' ')
}

interface OrcamentoPDFData {
  empresa: {
    nome: string
    cnpj: string
    endereco: string
    contato: string
    logo?: string
  }
  documento: {
    titulo: string
    numero: string
    geradoEm: string
  }
  cliente: {
    nome: string
    obra: string
    endereco?: string
    tipo?: string
    equipamento: string
  }
  especificacoes: {
    alturaInicial?: string
    alturaFinal?: string
    lanca?: string
    cargaMax?: string
    cargaPonta?: string
    potencia?: string
    energia?: string
  }
  custosMensais: Array<{ nome: string; valor: number }>
  // Valores detalhados para tabelas
  custosMensaisDetalhados?: Array<{
    tipo: string
    quantidade: number
    valor_unitario: number
    valor_total: number
    unidade?: string
  }>
  servicosAdicionais?: Array<{
    tipo: string
    descricao: string
    quantidade: number
    valor_unitario: number
    valor_total: number
    unidade?: string
  }>
  prazo: {
    meses: number
    inicioEstimado?: string
    tolerancia?: string
  }
  escopoIncluso?: string
  responsabilidadesCliente?: string
  condicoesComerciais?: string
}

const SectionRow = ({ label, value }: { label: string; value: string }) => (
  <View style={{ marginBottom: 8 }}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value || "-"}</Text>
  </View>
)

export const OrcamentoPDFDocument = ({ data }: { data: OrcamentoPDFData }) => {
  const totalMensal = data.custosMensais.reduce((acc, i) => acc + (i.valor || 0), 0)
  
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Cabeçalho */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {data.empresa.logo && (
              <View style={styles.logoContainer}>
                <Image
                  src={
                    data.empresa.logo.startsWith('data:')
                      ? data.empresa.logo
                      : data.empresa.logo.startsWith('/')
                        ? data.empresa.logo
                        : `/${data.empresa.logo}`
                  }
                  style={{ width: 60, height: 60 }}
                />
              </View>
            )}
            <View style={styles.headerInfo}>
              <Text style={styles.brand}>{data.empresa.nome}</Text>
              <Text style={styles.subBrand}>CNPJ: {data.empresa.cnpj}</Text>
              <Text style={styles.subBrand}>{data.empresa.endereco}</Text>
              <Text style={styles.subBrand}>{data.empresa.contato}</Text>
            </View>
          </View>
          <View>
            <Text style={styles.docTitle}>{data.documento.titulo}</Text>
            <Text style={[styles.docTitle, { fontWeight: "normal" }]}>
              Nº {data.documento.numero}
            </Text>
          </View>
        </View>

        {/* Identificação */}
        <Text style={styles.sectionTitle}>Identificação</Text>
        <View style={styles.card}>
          <View style={styles.grid2}>
            <View style={styles.col}>
              <SectionRow label="Cliente" value={formatTitleCase(data.cliente.nome)} />
              <SectionRow label="Obra" value={formatTitleCase(data.cliente.obra)} />
              {data.cliente.endereco && (
                <SectionRow label="Endereço" value={data.cliente.endereco} />
              )}
            </View>
            <View style={styles.col}>
              {data.cliente.tipo && (
                <SectionRow label="Tipo" value={formatTitleCase(data.cliente.tipo)} />
              )}
              <SectionRow label="Equipamento" value={data.cliente.equipamento} />
            </View>
          </View>
        </View>

        {/* Especificações Técnicas */}
        {(data.especificacoes.alturaInicial || data.especificacoes.lanca) && (
          <>
            <Text style={styles.sectionTitle}>Especificações Técnicas</Text>
            <View style={styles.card}>
              <View style={styles.grid2}>
                <View style={styles.col}>
                  {(data.especificacoes.alturaInicial || data.especificacoes.alturaFinal) && (
                    <SectionRow
                      label="Altura Inicial / Final"
                      value={`${data.especificacoes.alturaInicial || "-"} / ${data.especificacoes.alturaFinal || "-"}`}
                    />
                  )}
                  {data.especificacoes.lanca && (
                    <SectionRow
                      label="Comprimento da Lança"
                      value={data.especificacoes.lanca}
                    />
                  )}
                  {data.especificacoes.cargaMax && (
                    <SectionRow
                      label="Carga Máxima"
                      value={data.especificacoes.cargaMax}
                    />
                  )}
                </View>
                <View style={styles.col}>
                  {data.especificacoes.cargaPonta && (
                    <SectionRow
                      label="Carga na Ponta"
                      value={data.especificacoes.cargaPonta}
                    />
                  )}
                  {data.especificacoes.potencia && (
                    <SectionRow
                      label="Potência Elétrica"
                      value={data.especificacoes.potencia}
                    />
                  )}
                  {data.especificacoes.energia && (
                    <SectionRow
                      label="Energia Necessária"
                      value={data.especificacoes.energia}
                    />
                  )}
                </View>
              </View>
            </View>
          </>
        )}

        {/* Valores */}
        <Text style={styles.sectionTitle}>Valores</Text>
        <View style={styles.card}>
          {data.custosMensais.map((c, idx) => (
            <View style={styles.row} key={idx}>
              <Text>{c.nome}</Text>
              <Text>{money(c.valor)}/mês</Text>
            </View>
          ))}
          <View style={styles.totalBox}>
            <View style={styles.row}>
              <Text style={styles.totalText}>TOTAL MENSAL</Text>
              <Text style={styles.totalText}>{money(totalMensal)}</Text>
            </View>
          </View>
        </View>

        {/* Valores Detalhados - Custo de Obra Mensal */}
        {data.custosMensaisDetalhados && data.custosMensaisDetalhados.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>CUSTO DE OBRA - MENSAL</Text>
            <View style={styles.table}>
              {/* Cabeçalho da tabela */}
              <View style={[styles.tableRow, styles.tableHeader]}>
                <Text style={[styles.tableCell, { flex: 2 }]}>Tipo</Text>
                <Text style={styles.tableCellRight}>Quantidade</Text>
                <Text style={styles.tableCellRight}>Valor Unitário</Text>
                <Text style={styles.tableCellRight}>Valor Total</Text>
              </View>
              {/* Linhas da tabela */}
              {data.custosMensaisDetalhados.map((custo, idx) => (
                <View style={styles.tableRow} key={idx}>
                  <Text style={[styles.tableCell, { flex: 2 }]}>{custo.tipo}</Text>
                  <Text style={styles.tableCellRight}>
                    {custo.quantidade} {custo.unidade || ''}
                  </Text>
                  <Text style={styles.tableCellRight}>{money(custo.valor_unitario)}</Text>
                  <Text style={styles.tableCellRight}>{money(custo.valor_total)}</Text>
                </View>
              ))}
              {/* Total */}
              <View style={[styles.tableRow, { backgroundColor: "#F9FAFB" }]}>
                <Text style={[styles.tableCell, { flex: 2, fontWeight: "bold" }]}>TOTAL MENSAL</Text>
                <Text style={styles.tableCellRight}></Text>
                <Text style={styles.tableCellRight}></Text>
                <Text style={[styles.tableCellRight, { fontWeight: "bold" }]}>
                  {money(data.custosMensaisDetalhados.reduce((sum, c) => sum + (c.valor_total || 0), 0))}
                </Text>
              </View>
            </View>
          </>
        )}

        {/* Valores Detalhados - Serviços Adicionais */}
        {data.servicosAdicionais && data.servicosAdicionais.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>VALOR TOTAL DOS SERVIÇOS</Text>
            <View style={styles.table}>
              {/* Cabeçalho da tabela */}
              <View style={[styles.tableRow, styles.tableHeader]}>
                <Text style={[styles.tableCell, { flex: 2 }]}>Tipo</Text>
                <Text style={styles.tableCellRight}>Quantidade</Text>
                <Text style={styles.tableCellRight}>Valor Unitário</Text>
                <Text style={styles.tableCellRight}>Valor Total</Text>
              </View>
              {/* Linhas da tabela */}
              {data.servicosAdicionais.map((servico, idx) => (
                <View style={styles.tableRow} key={idx}>
                  <Text style={[styles.tableCell, { flex: 2 }]}>{servico.tipo || servico.descricao}</Text>
                  <Text style={styles.tableCellRight}>
                    {servico.quantidade} {servico.unidade || ''}
                  </Text>
                  <Text style={styles.tableCellRight}>{money(servico.valor_unitario)}</Text>
                  <Text style={styles.tableCellRight}>{money(servico.valor_total)}</Text>
                </View>
              ))}
              {/* Total */}
              <View style={[styles.tableRow, { backgroundColor: "#F9FAFB" }]}>
                <Text style={[styles.tableCell, { flex: 2, fontWeight: "bold" }]}>TOTAL SERVIÇOS</Text>
                <Text style={styles.tableCellRight}></Text>
                <Text style={styles.tableCellRight}></Text>
                <Text style={[styles.tableCellRight, { fontWeight: "bold" }]}>
                  {money(data.servicosAdicionais.reduce((sum, s) => sum + (s.valor_total || 0), 0))}
                </Text>
              </View>
            </View>
          </>
        )}

        {/* Prazos e Datas */}
        <Text style={styles.sectionTitle}>Prazos e Datas</Text>
        <View style={styles.card}>
          <View style={styles.grid2}>
            <View style={styles.col}>
              <SectionRow
                label="Prazo de Locação"
                value={`${data.prazo.meses} meses`}
              />
            </View>
            <View style={styles.col}>
              {data.prazo.inicioEstimado && (
                <SectionRow
                  label="Início Estimado"
                  value={`${ptDate(data.prazo.inicioEstimado)}${data.prazo.tolerancia ? ` (${data.prazo.tolerancia})` : ""}`}
                />
              )}
            </View>
          </View>
        </View>

        {/* Escopo Básico Incluso */}
        {data.escopoIncluso && (
          <>
            <Text style={styles.sectionTitle}>Escopo Básico Incluso</Text>
            <View style={styles.card}>
              <Text style={styles.textArea}>{data.escopoIncluso}</Text>
            </View>
          </>
        )}

        {/* Responsabilidades do Cliente */}
        {data.responsabilidadesCliente && (
          <>
            <Text style={styles.sectionTitle}>Responsabilidades do Cliente</Text>
            <View style={styles.card}>
              <Text style={styles.textArea}>{data.responsabilidadesCliente}</Text>
            </View>
          </>
        )}

        {/* Condições Comerciais */}
        {data.condicoesComerciais && (
          <>
            <Text style={styles.sectionTitle}>Condições Comerciais</Text>
            <View style={styles.card}>
              <Text style={styles.textArea}>{data.condicoesComerciais}</Text>
            </View>
          </>
        )}

        {/* Rodapé */}
        <View style={styles.footer} fixed>
          <Text>
            Gerado em: {ptDate(data.documento.geradoEm)} às{" "}
            {new Date(data.documento.geradoEm).toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit"
            })}
          </Text>
          <Text
            render={({ pageNumber, totalPages }) =>
              `Página ${pageNumber} de ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  )
}

// Componente de download
export function OrcamentoPDFDownload({ 
  data, 
  fileName 
}: { 
  data: OrcamentoPDFData
  fileName?: string 
}) {
  return (
    <PDFDownloadLink
      document={<OrcamentoPDFDocument data={data} />}
      fileName={fileName || `${data?.documento?.numero || "orcamento"}.pdf`}
      style={{
        padding: "10px 16px",
        borderRadius: 8,
        backgroundColor: "#111827",
        color: "#fff",
        textDecoration: "none",
        fontFamily: "Inter, sans-serif",
        fontSize: "14px",
        fontWeight: 500,
        display: "inline-flex",
        alignItems: "center",
        gap: "8px"
      }}
    >
      {({ loading }) => (loading ? "Gerando PDF..." : "Baixar PDF")}
    </PDFDownloadLink>
  )
}

