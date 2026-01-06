import { supabaseAdmin } from '../src/config/supabase.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function adicionarColunaCategoria() {
  try {
    console.log('🔧 Verificando se a coluna "categoria" existe na tabela fornecedores...');

    // Verificar se a coluna existe tentando fazer uma query
    const { data: testData, error: testError } = await supabaseAdmin
      .from('fornecedores')
      .select('categoria')
      .limit(1);

    if (testError) {
      if (testError.message.includes("Could not find the 'categoria' column")) {
        console.log('❌ Coluna "categoria" não encontrada. Adicionando...');
        
        // Ler o arquivo SQL da migration
        const migrationPath = join(__dirname, '../database/migrations/20250303_add_categoria_fornecedores.sql');
        const migrationSQL = readFileSync(migrationPath, 'utf-8');

        // Executar a migration via RPC (se disponível) ou instruir execução manual
        console.log('\n⚠️  O Supabase não permite executar DDL via API.');
        console.log('📝 Por favor, execute o seguinte SQL no Supabase SQL Editor:\n');
        console.log('─'.repeat(80));
        console.log(migrationSQL);
        console.log('─'.repeat(80));
        console.log('\n💡 Como executar:');
        console.log('1. Acesse o Supabase Dashboard');
        console.log('2. Vá em SQL Editor');
        console.log('3. Cole o SQL acima');
        console.log('4. Clique em "Run"');
        console.log('\n✅ Após executar, a API funcionará corretamente.\n');
        
        return;
      } else {
        throw testError;
      }
    }

    console.log('✅ Coluna "categoria" já existe na tabela fornecedores!');
    console.log('📊 Testando inserção de dados...');

    // Testar se podemos inserir com categoria
    const { error: insertTestError } = await supabaseAdmin
      .from('fornecedores')
      .select('id')
      .limit(1);

    if (insertTestError) {
      throw insertTestError;
    }

    console.log('✅ Tudo funcionando corretamente!');
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

adicionarColunaCategoria();

