// Script para testar as APIs de aprovação de horas extras
const BASE_URL = 'http://localhost:3001';

async function testarAPIs() {
  console.log('🧪 Testando APIs de Aprovação de Horas Extras\n');

  // 1. Testar se o servidor está rodando
  try {
    const response = await fetch(`${BASE_URL}/health`);
    if (response.ok) {
      console.log('✅ Servidor está rodando na porta 3001');
    } else {
      console.log('❌ Servidor não está respondendo corretamente');
      return;
    }
  } catch (error) {
    console.log('❌ Erro ao conectar com o servidor:', error.message);
    console.log('💡 Certifique-se de que o servidor está rodando com: npm run dev');
    return;
  }

  // 2. Testar endpoint de gestores (sem autenticação primeiro)
  console.log('\n📋 Testando endpoint de gestores...');
  try {
    const response = await fetch(`${BASE_URL}/api/ponto-eletronico/obras/1/gestores`);
    console.log(`Status: ${response.status}`);
    
    if (response.status === 401) {
      console.log('✅ Endpoint existe (retornou 401 - não autenticado)');
    } else if (response.status === 404) {
      console.log('❌ Endpoint não encontrado');
    } else {
      const data = await response.json();
      console.log('✅ Endpoint funcionando:', data);
    }
  } catch (error) {
    console.log('❌ Erro ao testar endpoint de gestores:', error.message);
  }

  // 3. Testar endpoint de registros pendentes
  console.log('\n📋 Testando endpoint de registros pendentes...');
  try {
    const response = await fetch(`${BASE_URL}/api/ponto-eletronico/registros/pendentes-aprovacao?gestor_id=1`);
    console.log(`Status: ${response.status}`);
    
    if (response.status === 401) {
      console.log('✅ Endpoint existe (retornou 401 - não autenticado)');
    } else if (response.status === 404) {
      console.log('❌ Endpoint não encontrado');
    } else {
      const data = await response.json();
      console.log('✅ Endpoint funcionando:', data);
    }
  } catch (error) {
    console.log('❌ Erro ao testar endpoint de registros pendentes:', error.message);
  }

  // 4. Testar documentação Swagger
  console.log('\n📚 Testando documentação Swagger...');
  try {
    const response = await fetch(`${BASE_URL}/api-docs`);
    if (response.ok) {
      console.log('✅ Documentação Swagger disponível em: http://localhost:3001/api-docs');
    } else {
      console.log('❌ Documentação Swagger não disponível');
    }
  } catch (error) {
    console.log('❌ Erro ao acessar documentação:', error.message);
  }

  console.log('\n🎯 Próximos passos para teste completo:');
  console.log('1. Acesse: http://localhost:3000 (frontend)');
  console.log('2. Faça login como funcionário');
  console.log('3. Crie um registro com mais de 8h trabalhadas');
  console.log('4. Envie para aprovação');
  console.log('5. Teste como gestor no PWA: http://localhost:3000/pwa');
}

// Executar testes
testarAPIs().catch(console.error);
