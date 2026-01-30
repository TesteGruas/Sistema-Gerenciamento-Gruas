/**
 * Script para remover registro de teste automático de ponto eletrônico
 * Executar: node scripts/remover-registro-teste-ponto.js
 */

import { supabaseAdmin } from '../src/config/supabase.js';

async function removerRegistroTeste() {
  try {
    console.log('🔍 Buscando registros de teste...');

    // Buscar registros de teste
    const { data: registros, error: errorBusca } = await supabaseAdmin
      .from('registros_ponto')
      .select('id, funcionario_id, data, observacoes')
      .or('id.eq.TEST03565204VC,observacoes.ilike.%Registro de teste criado automaticamente%');

    if (errorBusca) {
      console.error('❌ Erro ao buscar registros:', errorBusca);
      return;
    }

    if (!registros || registros.length === 0) {
      console.log('✅ Nenhum registro de teste encontrado.');
      return;
    }

    console.log(`📋 Encontrados ${registros.length} registro(s) de teste:`);
    registros.forEach(r => {
      console.log(`   - ID: ${r.id}, Data: ${r.data}, Observações: ${r.observacoes?.substring(0, 50)}...`);
    });

    // Deletar aprovações relacionadas primeiro
    console.log('\n🔍 Buscando aprovações relacionadas...');
    const { data: aprovacoes, error: errorAprovacoes } = await supabaseAdmin
      .from('aprovacoes_horas_extras')
      .select('id, registro_ponto_id, observacoes')
      .or('observacoes.ilike.%Registro de teste criado automaticamente%,observacoes.ilike.%TEST03565204VC%');

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

    // Deletar registros de ponto
    console.log('\n🗑️  Deletando registros de ponto de teste...');
    const idsRegistros = registros.map(r => r.id);
    const { error: errorDelete } = await supabaseAdmin
      .from('registros_ponto')
      .delete()
      .in('id', idsRegistros);

    if (errorDelete) {
      console.error('❌ Erro ao deletar registros:', errorDelete);
      return;
    }

    console.log(`✅ ${registros.length} registro(s) de teste deletado(s) com sucesso!`);
    console.log('\n📝 IDs deletados:');
    idsRegistros.forEach(id => console.log(`   - ${id}`));

  } catch (error) {
    console.error('❌ Erro ao executar script:', error);
  }
}

// Executar
removerRegistroTeste()
  .then(() => {
    console.log('\n✅ Script concluído.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });
