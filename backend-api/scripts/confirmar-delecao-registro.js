/**
 * Script para confirmar que o registro TEST03565204VC foi deletado
 */

import { supabaseAdmin } from '../src/config/supabase.js';

async function confirmarDelecao() {
  const registroId = 'TEST03565204VC';
  
  try {
    console.log(`🔍 Verificando se o registro ${registroId} existe no banco...\n`);

    // Buscar o registro específico
    const { data: registro, error } = await supabaseAdmin
      .from('registros_ponto')
      .select('id, funcionario_id, data, observacoes, created_at')
      .eq('id', registroId)
      .maybeSingle();

    if (error) {
      console.error('❌ Erro ao buscar:', error);
      return;
    }

    if (!registro) {
      console.log(`✅ CONFIRMADO: O registro ${registroId} NÃO existe mais no banco de dados.`);
      console.log('\n📝 O registro foi deletado com sucesso!');
      console.log('\n💡 Se você ainda está vendo o registro na API, pode ser cache:');
      console.log('   1. Limpe o cache do navegador (Ctrl+Shift+R ou Cmd+Shift+R)');
      console.log('   2. Recarregue a página');
      console.log('   3. Verifique se o backend não está usando cache');
    } else {
      console.log(`⚠️  ATENÇÃO: O registro ${registroId} AINDA existe no banco!`);
      console.log('\n📋 Detalhes do registro:');
      console.log(`   - ID: ${registro.id}`);
      console.log(`   - Funcionário ID: ${registro.funcionario_id}`);
      console.log(`   - Data: ${registro.data}`);
      console.log(`   - Criado em: ${registro.created_at}`);
      console.log(`   - Observações: ${registro.observacoes}`);
      console.log('\n🔄 Tentando deletar novamente...');
      
      const { error: deleteError } = await supabaseAdmin
        .from('registros_ponto')
        .delete()
        .eq('id', registroId);

      if (deleteError) {
        console.error('❌ Erro ao deletar:', deleteError);
      } else {
        console.log('✅ Registro deletado com sucesso!');
      }
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

confirmarDelecao()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });
