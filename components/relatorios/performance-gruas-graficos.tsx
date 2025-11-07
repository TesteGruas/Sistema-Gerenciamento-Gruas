"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts'
import type { GruaPerformance } from "@/lib/mocks/performance-gruas-mocks"

interface PerformanceGruasGraficosProps {
  dados: GruaPerformance[]
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']

export function PerformanceGruasGraficos({ dados }: PerformanceGruasGraficosProps) {
  // Preparar dados para gráfico de taxa de utilização
  const dadosUtilizacao = dados
    .sort((a, b) => b.metricas.taxa_utilizacao - a.metricas.taxa_utilizacao)
    .slice(0, 10)
    .map(item => ({
      grua: item.grua.nome.substring(0, 15),
      utilizacao: Number(item.metricas.taxa_utilizacao.toFixed(1))
    }))

  // Preparar dados para gráfico de receita vs custo
  const dadosFinanceiro = dados
    .sort((a, b) => b.financeiro.receita_total - a.financeiro.receita_total)
    .slice(0, 10)
    .map(item => ({
      grua: item.grua.nome.substring(0, 15),
      receita: Number((item.financeiro.receita_total / 1000).toFixed(1)),
      custo: Number((item.financeiro.custo_total / 1000).toFixed(1)),
      lucro: Number((item.financeiro.lucro_bruto / 1000).toFixed(1))
    }))

  // Preparar dados para gráfico de ROI
  const dadosROI = dados
    .filter(item => item.roi.roi_percentual > 0)
    .sort((a, b) => b.roi.roi_percentual - a.roi.roi_percentual)
    .slice(0, 10)
    .map(item => ({
      grua: item.grua.nome.substring(0, 15),
      roi: Number(item.roi.roi_percentual.toFixed(1))
    }))

  // Preparar dados para gráfico de distribuição de horas
  const totalHorasTrabalhadas = dados.reduce((sum, item) => sum + item.metricas.horas_trabalhadas, 0)
  const totalHorasOciosas = dados.reduce((sum, item) => sum + item.metricas.horas_ociosas, 0)
  const dadosDistribuicaoHoras = [
    { name: 'Trabalhadas', value: totalHorasTrabalhadas },
    { name: 'Ociosas', value: totalHorasOciosas }
  ]

  // Preparar dados para top 10 por lucro
  const dadosTopLucro = dados
    .sort((a, b) => b.financeiro.lucro_bruto - a.financeiro.lucro_bruto)
    .slice(0, 10)
    .map(item => ({
      grua: item.grua.nome.substring(0, 15),
      lucro: Number((item.financeiro.lucro_bruto / 1000).toFixed(1))
    }))

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Taxa de Utilização por Grua */}
      <Card>
        <CardHeader>
          <CardTitle>Taxa de Utilização - Top 10</CardTitle>
          <CardDescription>Gruas com maior taxa de utilização</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsBarChart data={dadosUtilizacao}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="grua" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <RechartsTooltip formatter={(value: number) => [`${value}%`, 'Taxa de Utilização']} />
              <Legend />
              <Bar dataKey="utilizacao" fill="#3b82f6" name="Taxa de Utilização (%)" />
            </RechartsBarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Receita vs Custo por Grua */}
      <Card>
        <CardHeader>
          <CardTitle>Receita vs Custo - Top 10</CardTitle>
          <CardDescription>Comparativo financeiro por grua</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsBarChart data={dadosFinanceiro}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="grua" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <RechartsTooltip formatter={(value: number) => [`R$ ${(value * 1000).toLocaleString('pt-BR')}`, '']} />
              <Legend />
              <Bar dataKey="receita" fill="#10b981" name="Receita (R$ mil)" />
              <Bar dataKey="custo" fill="#ef4444" name="Custo (R$ mil)" />
            </RechartsBarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* ROI por Grua */}
      <Card>
        <CardHeader>
          <CardTitle>ROI por Grua - Top 10</CardTitle>
          <CardDescription>Retorno sobre investimento</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsBarChart data={dadosROI}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="grua" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <RechartsTooltip formatter={(value: number) => [`${value}%`, 'ROI']} />
              <Legend />
              <Bar dataKey="roi" fill="#8b5cf6" name="ROI (%)" />
            </RechartsBarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Distribuição de Horas */}
      <Card>
        <CardHeader>
          <CardTitle>Distribuição de Horas</CardTitle>
          <CardDescription>Trabalhadas vs Ociosas</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPieChart>
              <Pie
                data={dadosDistribuicaoHoras}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {dadosDistribuicaoHoras.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#94a3b8'} />
                ))}
              </Pie>
              <RechartsTooltip formatter={(value: number) => [`${value.toLocaleString('pt-BR')}h`, '']} />
              <Legend />
            </RechartsPieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top 10 por Lucro */}
      <Card>
        <CardHeader>
          <CardTitle>Top 10 Gruas por Lucro</CardTitle>
          <CardDescription>Gruas que mais geraram lucro</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsBarChart data={dadosTopLucro}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="grua" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <RechartsTooltip formatter={(value: number) => [`R$ ${(value * 1000).toLocaleString('pt-BR')}`, 'Lucro']} />
              <Legend />
              <Bar dataKey="lucro" fill="#10b981" name="Lucro (R$ mil)" />
            </RechartsBarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Margem de Lucro por Grua */}
      <Card>
        <CardHeader>
          <CardTitle>Margem de Lucro - Top 10</CardTitle>
          <CardDescription>Percentual de margem por grua</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsBarChart
              data={dados
                .sort((a, b) => b.financeiro.margem_lucro - a.financeiro.margem_lucro)
                .slice(0, 10)
                .map(item => ({
                  grua: item.grua.nome.substring(0, 15),
                  margem: Number(item.financeiro.margem_lucro.toFixed(1))
                }))}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="grua" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <RechartsTooltip formatter={(value: number) => [`${value}%`, 'Margem']} />
              <Legend />
              <Bar dataKey="margem" fill="#f59e0b" name="Margem de Lucro (%)" />
            </RechartsBarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}

