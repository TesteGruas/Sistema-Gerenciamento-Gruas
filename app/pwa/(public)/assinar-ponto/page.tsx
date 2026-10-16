'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { SignaturePad } from '@/components/signature-pad'
import { getApiBasePath } from '@/lib/runtime-config'

type PontoPublico = {
  registro_id: string
  funcionario_nome: string
  obra_nome: string
  data: string
  entrada: string
  saida: string
  saida_almoco: string
  volta_almoco: string
  horas_trabalhadas: string
  horas_extras: string
  responsavel_nome: string
  ja_assinado: boolean
  status: string | null
}

function AssinarPontoPublicoPage() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token') || ''
  const [ponto, setPonto] = useState<PontoPublico | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [assinatura, setAssinatura] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [assinado, setAssinado] = useState(false)

  useEffect(() => {
    if (!token) {
      setErro('Link de assinatura inválido.')
      setCarregando(false)
      return
    }

    let cancelado = false
    const carregar = async () => {
      try {
        const resposta = await fetch(
          `${getApiBasePath()}/ponto-eletronico/assinatura-responsavel?token=${encodeURIComponent(token)}`
        )
        const corpo = await resposta.json().catch(() => ({}))
        if (cancelado) return
        if (!resposta.ok || !corpo?.success) {
          setErro(corpo?.message || 'Não foi possível abrir este ponto.')
          return
        }
        setPonto(corpo.data)
        setAssinado(Boolean(corpo.data?.ja_assinado))
      } catch {
        if (!cancelado) setErro('Não foi possível abrir este ponto.')
      } finally {
        if (!cancelado) setCarregando(false)
      }
    }

    carregar()
    return () => {
      cancelado = true
    }
  }, [token])

  const assinar = async () => {
    if (!assinatura.trim()) {
      setErro('Desenhe a assinatura antes de confirmar.')
      return
    }
    setEnviando(true)
    setErro('')
    try {
      const resposta = await fetch(`${getApiBasePath()}/ponto-eletronico/assinatura-responsavel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          assinatura_digital: assinatura,
          observacoes: observacoes.trim() || undefined,
        }),
      })
      const corpo = await resposta.json().catch(() => ({}))
      if (!resposta.ok || !corpo?.success) {
        setErro(corpo?.message || 'Não foi possível assinar o ponto.')
        if (resposta.status === 409) setAssinado(true)
        return
      }
      setAssinado(true)
      if (corpo.data) setPonto(corpo.data)
    } catch {
      setErro('Não foi possível assinar o ponto.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900">
      <div className="mx-auto flex w-full max-w-md flex-col gap-4">
        <header>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Irbana</p>
          <h1 className="text-xl font-semibold">Assinar ponto</h1>
        </header>

        {carregando ? (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando o registro…
          </div>
        ) : null}

        {erro ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</p>
        ) : null}

        {ponto ? (
          <section className="rounded-lg border bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">Responsável</p>
            <p className="font-medium">{ponto.responsavel_nome}</p>
            <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
              <div className="col-span-2">
                <dt className="text-slate-500">Funcionário</dt>
                <dd>{ponto.funcionario_nome}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-slate-500">Obra</dt>
                <dd>{ponto.obra_nome}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Data</dt>
                <dd>{ponto.data}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Horas</dt>
                <dd>
                  {ponto.horas_trabalhadas}h · extras {ponto.horas_extras}h
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Entrada</dt>
                <dd>{ponto.entrada}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Saída</dt>
                <dd>{ponto.saida}</dd>
              </div>
            </dl>
          </section>
        ) : null}

        {ponto && assinado ? (
          <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-800">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <p>Ponto assinado. O funcionário já pode confirmar a assinatura dele.</p>
          </div>
        ) : null}

        {ponto && !assinado ? (
          <section className="flex flex-col gap-3 rounded-lg border bg-white p-4 shadow-sm">
            <div>
              <label className="text-sm font-medium" htmlFor="observacoes-ponto">
                Observação
              </label>
              <Textarea
                id="observacoes-ponto"
                value={observacoes}
                onChange={(evento) => setObservacoes(evento.target.value)}
                placeholder="Opcional"
                className="mt-1"
                rows={2}
              />
            </div>
            <SignaturePad
              compact
              compactDense
              showCancelButton={false}
              title=""
              description=""
              applyLabel="Usar esta assinatura"
              onSave={setAssinatura}
              onCancel={() => setAssinatura('')}
            />
            <Button type="button" onClick={assinar} disabled={enviando || !assinatura}>
              {enviando ? 'Assinando…' : 'Assinar e validar o ponto'}
            </Button>
          </section>
        ) : null}
      </div>
    </main>
  )
}

export default function AssinarPontoPublico() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-50 px-4 py-6 text-sm text-slate-600">Carregando o registro…</main>
      }
    >
      <AssinarPontoPublicoPage />
    </Suspense>
  )
}
