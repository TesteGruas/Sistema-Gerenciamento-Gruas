/**
 * Script para deletar registro específico de ponto eletrônico
 * Executar: node scripts/deletar-registro-especifico.js TEST03565204VC
 */

import { supabaseAdmin } from '../src/config/supabase.js';

const registroId = process.argv[2] || 'TEST03565204VC';

async function deletarRegistroEspecifico() {
  try {
    console.log(`🔍 Buscando registro com ID: ${registroId}`);

    // Verificar se o registro existe
    const { data: registro, error: errorBusca } = await supabaseAdmin
      .from('registros_ponto')
      .select('id, funcionario_id, data, observacoes')
      .eq('id', registroId)
      .single();

    if (errorBusca || !registro) {
      console.log('✅ Registro não encontrado (já foi deletado ou não existe).');
      return;
    }

    console.log('📋 Registro encontrado:');
    console.log(`   - ID: ${registro.id}`);
    console.log(`   - Funcionário ID: ${registro.funcionario_id}`);
    console.log(`   - Data: ${registro.data}`);
    console.log(`   - Observações: ${registro.observacoes}`);

    // Deletar aprovações relacionadas primeiro
    console.log('\n🔍 Buscando aprovações relacionadas...');
    const { data: aprovacoes, error: errorAprovacoes } = await supabaseAdmin
      .from('aprovacoes_horas_extras')
      .select('id, registro_ponto_id, observacoes')
      .or(`observacoes.ilike.%${registroId}%,registro_ponto_id.eq.${registroId}`);

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
    } else {
      console.log('✅ Nenhuma aprovação relacionada encontrada.');
    }

    // Deletar o registro de ponto
    console.log(`\n🗑️  Deletando registro ${registroId}...`);
    const { error: errorDelete } = await supabaseAdmin
      .from('registros_ponto')
      .delete()
      .eq('id', registroId);

    if (errorDelete) {
      console.error('❌ Erro ao deletar registro:', errorDelete);
      return;
    }

    console.log(`✅ Registro ${registroId} deletado com sucesso!`);

    // Verificar se foi realmente deletado
    const { data: verificacao, error: errorVerificacao } = await supabaseAdmin
      .from('registros_ponto')
      .select('id')
      .eq('id', registroId)
      .single();

    if (errorVerificacao || !verificacao) {
      console.log('✅ Confirmação: Registro não existe mais no banco de dados.');
    } else {
      console.log('⚠️  Atenção: Registro ainda existe no banco de dados.');
    }

  } catch (error) {
    console.error('❌ Erro ao executar script:', error);
  }
}

// Executar
deletarRegistroEspecifico()
  .then(() => {
    console.log('\n✅ Script concluído.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });
