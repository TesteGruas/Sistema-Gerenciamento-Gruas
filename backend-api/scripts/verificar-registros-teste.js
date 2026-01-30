/**
 * Script para verificar e limpar TODOS os registros de teste
 */

import { supabaseAdmin } from '../src/config/supabase.js';

async function verificarELimparRegistrosTeste() {
  try {
    console.log('🔍 Buscando TODOS os registros de teste...');

    // Buscar todos os registros que podem ser de teste
    const { data: registros, error: errorBusca } = await supabaseAdmin
      .from('registros_ponto')
      .select('id, funcionario_id, data, observacoes, created_at')
      .or('id.like.TEST%,id.like.SEED%,observacoes.ilike.%teste%,observacoes.ilike.%Teste%,observacoes.ilike.%TEST%')
      .order('created_at', { ascending: false });

    if (errorBusca) {
      console.error('❌ Erro ao buscar registros:', errorBusca);
      return;
    }

    if (!registros || registros.length === 0) {
      console.log('✅ Nenhum registro de teste encontrado.');
      return;
    }

    console.log(`\n📋 Encontrados ${registros.length} registro(s) de teste:\n`);
    registros.forEach((r, index) => {
      console.log(`${index + 1}. ID: ${r.id}`);
      console.log(`   Funcionário ID: ${r.funcionario_id}`);
      console.log(`   Data: ${r.data}`);
      console.log(`   Criado em: ${r.created_at}`);
      console.log(`   Observações: ${r.observacoes?.substring(0, 80)}...`);
      console.log('');
    });

    // Deletar aprovações relacionadas
    console.log('🔍 Buscando aprovações relacionadas...');
    const idsRegistros = registros.map(r => r.id);
    const { data: aprovacoes, error: errorAprovacoes } = await supabaseAdmin
      .from('aprovacoes_horas_extras')
      .select('id, registro_ponto_id, observacoes')
      .in('registro_ponto_id', idsRegistros);

    if (!errorAprovacoes && aprovacoes && aprovacoes.length > 0) {
      console.log(`📋 Encontradas ${aprovacoes.length} aprovação(ões) relacionada(s)`);
      
      const idsAprovacoes = aprovacoes.map(a => a.id);
      const { error: errorDeleteAprovacoes } = await supabaseAdmin
        .from('aprovacoes_horas_extras')
        .delete()
        .in('id', idsAprovacoes);

      if (errorDeleteAprovacoes) {
        console.error('❌ Erro ao deletar aprovações:', errorDeleteAprovacoes);
      } else {
        console.log(`✅ ${aprovacoes.length} aprovação(ões) deletada(s)`);
      }
    }

    // Deletar registros
    console.log(`\n🗑️  Deletando ${registros.length} registro(s)...`);
    const { error: errorDelete } = await supabaseAdmin
      .from('registros_ponto')
      .delete()
      .in('id', idsRegistros);

    if (errorDelete) {
      console.error('❌ Erro ao deletar registros:', errorDelete);
      return;
    }

    console.log(`✅ ${registros.length} registro(s) deletado(s) com sucesso!`);

    // Verificar novamente
    const { data: verificacao } = await supabaseAdmin
      .from('registros_ponto')
      .select('id')
      .in('id', idsRegistros);

    if (!verificacao || verificacao.length === 0) {
      console.log('✅ Confirmação: Todos os registros foram removidos do banco de dados.');
    } else {
      console.log(`⚠️  Atenção: ${verificacao.length} registro(s) ainda existe(m) no banco.`);
    }

  } catch (error) {
    console.error('❌ Erro ao executar script:', error);
  }
}

// Executar
verificarELimparRegistrosTeste()
  .then(() => {
    console.log('\n✅ Script concluído.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });
