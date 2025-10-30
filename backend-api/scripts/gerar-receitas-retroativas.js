import { supabaseAdmin } from '../src/config/supabase.js';

async function gerarReceitasRetroativas() {
  console.log('🔄 Iniciando geração de receitas retroativas...');
  
  // Buscar todas as medições finalizadas sem receita associada
  const { data: medicoes, error } = await supabaseAdmin
    .from('medicoes')
    .select(`
      *,
      locacoes (
        id,
        numero,
        equipamento_id,
        tipo_equipamento,
        contrato_id
      )
    `)
    .eq('status', 'finalizada')
    .order('id', { ascending: true });

  if (error) {
    console.error('❌ Erro ao buscar medições:', error);
    return;
  }

  console.log(`📋 Encontradas ${medicoes.length} medições finalizadas`);
  
  let criadas = 0;
  let falhas = 0;
  let puladas = 0;

  for (const medicao of medicoes) {
    const locacao = medicao.locacoes;
    
    if (!locacao || !medicao.valor_total || medicao.valor_total <= 0) {
      console.log(`⏭️  Pulando medição ${medicao.numero} - sem locação ou valor`);
      puladas++;
      continue;
    }

    // Verificar se já existe receita para esta medição
    const { data: receitaExistente } = await supabaseAdmin
      .from('receitas')
      .select('id')
      .ilike('observacoes', `%medição ID ${medicao.id}%`)
      .maybeSingle();

    if (receitaExistente) {
      console.log(`⏭️  Pulando medição ${medicao.numero} - receita já existe`);
      puladas++;
      continue;
    }

    // Tentar buscar obra_id
    let obra_id = null;
    let metodo_busca = null;

    // Método 1: obra_gruas_configuracao
    const { data: configData } = await supabaseAdmin
      .from('obra_gruas_configuracao')
      .select('obra_id')
      .eq('grua_id', locacao.equipamento_id)
      .maybeSingle();

    if (configData?.obra_id) {
      obra_id = configData.obra_id;
      metodo_busca = 'obra_gruas_configuracao';
    }

    // Método 2: grua_obra
    if (!obra_id) {
      const { data: gruaObraData } = await supabaseAdmin
        .from('grua_obra')
        .select('obra_id')
        .eq('grua_id', locacao.equipamento_id)
        .eq('status', 'Ativa')
        .maybeSingle();
      
      if (gruaObraData?.obra_id) {
        obra_id = gruaObraData.obra_id;
        metodo_busca = 'grua_obra';
      }
    }

    // Método 3: contrato
    if (!obra_id && locacao.contrato_id) {
      const { data: contratoData } = await supabaseAdmin
        .from('contratos')
        .select('obra_id')
        .eq('id', locacao.contrato_id)
        .maybeSingle();
      
      if (contratoData?.obra_id) {
        obra_id = contratoData.obra_id;
        metodo_busca = 'contratos';
      }
    }

    if (!obra_id) {
      console.log(`❌ Medição ${medicao.numero} (ID: ${medicao.id}) - obra_id não encontrado`);
      console.log(`   Equipamento: ${locacao.equipamento_id}, Contrato: ${locacao.contrato_id || 'N/A'}`);
      falhas++;
      continue;
    }

    // Criar receita
    try {
      const { error: insertError } = await supabaseAdmin
        .from('receitas')
        .insert({
          obra_id: obra_id,
          grua_id: locacao.tipo_equipamento === 'grua' ? locacao.equipamento_id : null,
          tipo: 'locacao',
          descricao: `Receita automática - Medição ${medicao.numero} finalizada`,
          valor: medicao.valor_total,
          data_receita: medicao.data_medicao,
          status: 'confirmada',
          observacoes: `Gerada retroativamente pela medição ID ${medicao.id} (método: ${metodo_busca})`
        });

      if (insertError) {
        console.log(`❌ Erro ao criar receita para ${medicao.numero}:`, insertError.message);
        falhas++;
      } else {
        console.log(`✅ Receita criada para medição ${medicao.numero} (ID: ${medicao.id}) - R$ ${medicao.valor_total} via ${metodo_busca}`);
        criadas++;
      }
    } catch (error) {
      console.log(`❌ Exceção ao criar receita para ${medicao.numero}:`, error.message);
      falhas++;
    }
  }

  console.log('\n📊 Resumo:');
  console.log(`   ✅ Receitas criadas: ${criadas}`);
  console.log(`   ❌ Falhas: ${falhas}`);
  console.log(`   ⏭️  Puladas: ${puladas}`);
  console.log(`   📋 Total processado: ${medicoes.length}`);
}

// Executar
gerarReceitasRetroativas()
  .then(() => {
    console.log('\n✅ Script finalizado');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Erro fatal:', error);
    process.exit(1);
  });

