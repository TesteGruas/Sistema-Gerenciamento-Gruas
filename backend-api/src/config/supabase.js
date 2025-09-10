// Carregar variáveis de ambiente PRIMEIRO
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Configurar dotenv para ler o arquivo .env do diretório backend-api
const envPath = path.join(__dirname, '../../.env')
console.log('Tentando carregar .env de:', envPath)

// Carregar variáveis de ambiente
dotenv.config({ path: envPath })

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('SUPABASE_URL:', supabaseUrl ? 'Definido' : 'Não definido')
console.log('SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Definido' : 'Não definido')
console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'Definido' : 'Não definido')

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Variáveis de ambiente do Supabase não configuradas')
}

// Cliente com anon key para operações de autenticação (login, registro)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Cliente com service role key para operações administrativas (CRUD)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export default supabase
