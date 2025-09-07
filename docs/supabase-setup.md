# Configuração do Supabase - Sistema de Gerenciamento de Gruas

## Credenciais do Projeto

```bash
# Variáveis de ambiente
PUBLIC_SUPABASE_URL=https://mghdktkoejobsmdbvssl.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1naGRrdGtvZWpvYnNtZGJ2c3NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNDYzODcsImV4cCI6MjA3MjcyMjM4N30.9XpjiPOnY2BzulrpH6Cw3ZubTSbZ2NH5BH45tarXelA
```

## Setup Inicial

### 1. Instalar Supabase CLI
```bash
npm install -g supabase
```

### 2. Login no Supabase
```bash
supabase login
```

### 3. Inicializar projeto
```bash
supabase init
```

### 4. Conectar ao projeto remoto
```bash
supabase link --project-ref mghdktkoejobsmdbvssl
```

## Estrutura de Migrações

### Ordem de Criação das Tabelas

1. **Usuários e Autenticação**
   ```bash
   supabase migration new 001_create_users_table
   supabase migration new 002_create_profiles_table
   supabase migration new 003_create_permissions_table
   ```

2. **Módulo de Gruas**
   ```bash
   supabase migration new 004_create_clientes_table
   supabase migration new 005_create_obras_table
   supabase migration new 006_create_gruas_table
   supabase migration new 007_create_contratos_table
   ```

3. **Módulo de Estoque**
   ```bash
   supabase migration new 008_create_categorias_table
   supabase migration new 009_create_fornecedores_table
   supabase migration new 010_create_produtos_table
   supabase migration new 011_create_estoque_table
   ```

## Configuração do Supabase Client

### Frontend (Next.js)
```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Para SSR
export const createServerClient = () => {
  return createClient(supabaseUrl, supabaseAnonKey)
}
```

### Configuração de Tipos TypeScript
```typescript
// types/database.ts
export interface Database {
  public: {
    Tables: {
      usuarios: {
        Row: {
          id: number
          nome: string
          email: string
          cpf: string | null
          telefone: string | null
          status: 'Ativo' | 'Inativo' | 'Bloqueado' | 'Pendente'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          nome: string
          email: string
          cpf?: string | null
          telefone?: string | null
          status?: 'Ativo' | 'Inativo' | 'Bloqueado' | 'Pendente'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          nome?: string
          email?: string
          cpf?: string | null
          telefone?: string | null
          status?: 'Ativo' | 'Inativo' | 'Bloqueado' | 'Pendente'
          created_at?: string
          updated_at?: string
        }
      }
      // ... outras tabelas
    }
  }
}
```

## Row Level Security (RLS)

### Políticas Básicas para Usuários
```sql
-- Habilitar RLS
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

-- Política para usuários verem apenas seus próprios dados
CREATE POLICY "Users can view own profile" ON usuarios
  FOR SELECT USING (auth.uid()::text = id::text);

-- Política para administradores verem todos os usuários
CREATE POLICY "Admins can view all users" ON usuarios
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM usuario_perfis up
      JOIN perfis p ON up.perfil_id = p.id
      WHERE up.usuario_id = auth.uid()::int
      AND p.nivel_acesso >= 8
    )
  );
```

### Políticas para Gruas
```sql
-- Habilitar RLS
ALTER TABLE gruas ENABLE ROW LEVEL SECURITY;

-- Todos os usuários autenticados podem ver gruas
CREATE POLICY "Authenticated users can view gruas" ON gruas
  FOR SELECT USING (auth.role() = 'authenticated');

-- Apenas operadores e superiores podem editar
CREATE POLICY "Operators can edit gruas" ON gruas
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM usuario_perfis up
      JOIN perfis p ON up.perfil_id = p.id
      WHERE up.usuario_id = auth.uid()::int
      AND p.nivel_acesso >= 4
    )
  );
```

## Edge Functions

### Estrutura de Funções
```
supabase/functions/
├── auth/
│   ├── login/
│   │   └── index.ts
│   └── register/
│       └── index.ts
├── gruas/
│   ├── create-grua/
│   │   └── index.ts
│   └── update-status/
│       └── index.ts
└── estoque/
    ├── movimentar/
    │   └── index.ts
    └── gerar-alerta/
        └── index.ts
```

### Exemplo de Edge Function
```typescript
// supabase/functions/movimentar-estoque/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const { produto_id, tipo, quantidade, obra_id } = await req.json()
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // Lógica de movimentação
    const { data, error } = await supabaseClient
      .from('movimentacoes_estoque')
      .insert([{
        produto_id,
        tipo,
        quantidade,
        obra_id,
        data_movimentacao: new Date().toISOString()
      }])

    if (error) throw error

    return new Response(
      JSON.stringify({ success: true, data }),
      { headers: { "Content-Type": "application/json" } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    )
  }
})
```

## Deploy das Funções
```bash
# Deploy de uma função específica
supabase functions deploy movimentar-estoque

# Deploy de todas as funções
supabase functions deploy
```

## Configuração de Storage

### Buckets Necessários
```sql
-- Bucket para fotos de perfil
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Bucket para documentos
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);

-- Bucket para relatórios
INSERT INTO storage.buckets (id, name, public) VALUES ('reports', 'reports', false);
```

### Políticas de Storage
```sql
-- Política para avatars
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

-- Política para documentos (apenas usuários autenticados)
CREATE POLICY "Authenticated users can upload documents" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'documents' AND auth.role() = 'authenticated');
```

## Configuração de Realtime

### Habilitar Realtime para Tabelas
```sql
-- Habilitar realtime para gruas
ALTER PUBLICATION supabase_realtime ADD TABLE gruas;

-- Habilitar realtime para estoque
ALTER PUBLICATION supabase_realtime ADD TABLE estoque;

-- Habilitar realtime para movimentações
ALTER PUBLICATION supabase_realtime ADD TABLE movimentacoes_estoque;
```

### Uso no Frontend
```typescript
// Hook para escutar mudanças em tempo real
const useRealtimeGruas = () => {
  const [gruas, setGruas] = useState([])

  useEffect(() => {
    const channel = supabase
      .channel('gruas-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'gruas' },
        (payload) => {
          console.log('Change received!', payload)
          // Atualizar estado local
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return gruas
}
```

## Comandos Úteis

### Desenvolvimento Local
```bash
# Iniciar Supabase local
supabase start

# Parar Supabase local
supabase stop

# Reset do banco local
supabase db reset

# Aplicar migrações
supabase db push
```

### Produção
```bash
# Deploy de migrações
supabase db push --linked

# Backup do banco
supabase db dump --linked > backup.sql

# Restaurar backup
supabase db reset --linked
```

## Monitoramento e Logs

### Configuração de Logs
```sql
-- Habilitar logs de auditoria
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de logs de auditoria
CREATE TABLE audit_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL,
  old_data JSONB,
  new_data JSONB,
  user_id UUID,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Dashboard do Supabase
- Acesse: https://supabase.com/dashboard/project/mghdktkoejobsmdbvssl
- Monitore: Performance, Logs, Storage, Functions
- Configure: Auth, Database, API, Edge Functions

## Troubleshooting

### Problemas Comuns

1. **Erro de CORS**
   ```typescript
   // Configurar CORS no Supabase
   const supabase = createClient(url, key, {
     auth: {
       autoRefreshToken: true,
       persistSession: true,
       detectSessionInUrl: true
     }
   })
   ```

2. **Erro de RLS**
   ```sql
   -- Verificar se RLS está habilitado
   SELECT schemaname, tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public';
   ```

3. **Erro de Edge Functions**
   ```bash
   # Verificar logs das funções
   supabase functions logs movimentar-estoque
   ```

Esta configuração fornece uma base sólida para implementar o sistema de gerenciamento de gruas usando Supabase como backend.
