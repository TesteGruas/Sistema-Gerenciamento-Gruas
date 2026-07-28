/**
 * Seed idempotente dos tipos de benefício Termo + Recibo VR.
 * Uso: node scripts/seed-beneficios-termo-recibo-vr.js
 */
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, '../.env') })

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY

if (!url || !key) {
  console.error('SUPABASE_URL / SERVICE_ROLE_KEY ausentes no .env')
  process.exit(1)
}

const supabase = createClient(url, key)

const tipos = [
  {
    tipo: 'Termo de Reconhecimento e Ciência',
    descricao: 'Termo de reconhecimento e ciência',
    valor: 0,
    percentual: 0,
    ativo: true
  },
  {
    tipo: 'Recibo / Ajuda de Custo – Vale Refeição',
    descricao: 'Recibo / ajuda de custo – vale refeição',
    valor: 0,
    percentual: 0,
    ativo: true
  },
  {
    tipo: 'Recibo / Ajuda de Custo – Vale Transporte',
    descricao: 'Recibo / ajuda de custo – vale transporte',
    valor: 0,
    percentual: 0,
    ativo: true
  },
  {
    tipo: 'Recibo / Pagamento de Horas Extras',
    descricao: 'Recibo / pagamento de horas extras',
    valor: 0,
    percentual: 0,
    ativo: true
  }
]

for (const row of tipos) {
  const { data: existing, error: findErr } = await supabase
    .from('beneficios_tipo')
    .select('id, tipo')
    .eq('tipo', row.tipo)
    .maybeSingle()

  if (findErr) {
    console.error('Erro ao buscar', row.tipo, findErr.message)
    continue
  }

  if (existing) {
    const { error: updErr } = await supabase
      .from('beneficios_tipo')
      .update({ descricao: row.descricao })
      .eq('id', existing.id)
    if (updErr) console.error('Erro ao atualizar', row.tipo, updErr.message)
    else console.log('atualizado:', existing.id, existing.tipo)
    continue
  }

  const { data, error } = await supabase.from('beneficios_tipo').insert(row).select('id, tipo').single()
  if (error) {
    console.error('Erro ao inserir', row.tipo, error.message)
  } else {
    console.log('criado:', data.id, data.tipo)
  }
}
