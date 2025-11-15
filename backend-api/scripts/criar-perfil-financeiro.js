/**
 * Script para criar o perfil Financeiro no banco de dados
 * 
 * Uso: node scripts/criar-perfil-financeiro.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: Variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function criarPerfilFinanceiro() {
  try {
    console.log('🔍 Verificando se o perfil Financeiro já existe...');
    
    // Verificar se já existe
    const { data: perfilExistente, error: checkError } = await supabase
      .from('perfis')
      .select('*')
      .eq('nome', 'Financeiro')
      .single();
    
    if (perfilExistente) {
      console.log('✅ Perfil Financeiro já existe!');
      console.log(`   ID: ${perfilExistente.id}`);
      console.log(`   Nível: ${perfilExistente.nivel_acesso}`);
      console.log(`   Status: ${perfilExistente.status}`);
      return perfilExistente;
    }
    
    console.log('📝 Criando perfil Financeiro...');
    
    // Criar o perfil
    const { data: novoPerfil, error: createError } = await supabase
      .from('perfis')
      .insert({
        nome: 'Financeiro',
        descricao: 'Gestão financeira, orçamentos, contratos e relatórios financeiros',
        nivel_acesso: 8,
        status: 'Ativo',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (createError) {
      throw createError;
    }
    
    console.log('✅ Perfil Financeiro criado com sucesso!');
    console.log(`   ID: ${novoPerfil.id}`);
    console.log(`   Nome: ${novoPerfil.nome}`);
    console.log(`   Nível: ${novoPerfil.nivel_acesso}`);
    console.log(`   Status: ${novoPerfil.status}`);
    
    return novoPerfil;
  } catch (error) {
    console.error('❌ Erro ao criar perfil Financeiro:', error.message);
    throw error;
  }
}

// Executar
criarPerfilFinanceiro()
  .then(() => {
    console.log('\n✨ Processo concluído!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro fatal:', error);
    process.exit(1);
  });

