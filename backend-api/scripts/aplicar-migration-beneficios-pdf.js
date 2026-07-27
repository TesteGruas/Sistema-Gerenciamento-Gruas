/**
 * Aplica colunas de PDF/assinatura/mês em funcionario_beneficios.
 * Requer DATABASE_URL (connection string do Postgres do Supabase).
 *
 * Uso:
 *   DATABASE_URL='postgresql://postgres:...@db.xxx.supabase.co:5432/postgres' \
 *     node scripts/aplicar-migration-beneficios-pdf.js
 */
import pg from 'pg'
import dotenv from 'dotenv'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, '../.env') })

const url = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || process.env.POSTGRES_URL
if (!url) {
  console.error(`
DATABASE_URL não configurada.

1) Abra o SQL Editor do Supabase e execute o arquivo:
   backend-api/database/migrations/20260727_funcionario_beneficios_pdf_assinatura.sql

2) Ou defina DATABASE_URL e rode este script de novo.
`)
  process.exit(1)
}

const sql = readFileSync(
  join(__dirname, '../database/migrations/20260727_funcionario_beneficios_pdf_assinatura.sql'),
  'utf8'
)

const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } })
await client.connect()
try {
  await client.query(sql)
  console.log('Migration aplicada com sucesso.')
} finally {
  await client.end()
}
