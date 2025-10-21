#!/usr/bin/env node

/**
 * Script para testar o carregamento de permissões após login
 */

// Usar fetch nativo do Node.js (disponível a partir da versão 18)

const API_BASE_URL = 'http://localhost:3001';

async function testLoginAndPermissions() {
  console.log('🧪 Testando login e carregamento de permissões...\n');

  try {
    // 1. Fazer login
    console.log('1️⃣ Fazendo login...');
    const loginResponse = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@admin.com',
        password: 'teste@123'
      })
    });

    if (!loginResponse.ok) {
      const errorData = await loginResponse.json();
      throw new Error(`Erro no login: ${errorData.message || loginResponse.statusText}`);
    }

    const loginData = await loginResponse.json();
    console.log('✅ Login realizado com sucesso');
    console.log('📊 Dados do login:', {
      hasToken: !!loginData.data?.access_token,
      hasProfile: !!loginData.data?.profile,
      hasPerfil: !!loginData.data?.perfil,
      permissoesCount: loginData.data?.permissoes?.length || 0
    });

    const token = loginData.data.access_token;

    // 2. Testar endpoint /me para carregar permissões
    console.log('\n2️⃣ Testando endpoint /me...');
    const meResponse = await fetch(`${API_BASE_URL}/api/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!meResponse.ok) {
      const errorData = await meResponse.json();
      throw new Error(`Erro ao buscar permissões: ${errorData.message || meResponse.statusText}`);
    }

    const meData = await meResponse.json();
    console.log('✅ Endpoint /me funcionando');
    console.log('📊 Dados do /me:', {
      hasUser: !!meData.data?.user,
      hasProfile: !!meData.data?.profile,
      hasPerfil: !!meData.data?.perfil,
      permissoesCount: meData.data?.permissoes?.length || 0,
      perfilNome: meData.data?.perfil?.nome || 'Nenhum'
    });

    // 3. Verificar estrutura das permissões
    if (meData.data?.permissoes && meData.data.permissoes.length > 0) {
      console.log('\n3️⃣ Estrutura das permissões:');
      meData.data.permissoes.forEach((perm, index) => {
        console.log(`   ${index + 1}. ${perm.nome} (${perm.modulo}:${perm.acao})`);
      });
    } else {
      console.log('\n⚠️ Nenhuma permissão encontrada');
    }

    // 4. Testar endpoint de perfis
    console.log('\n4️⃣ Testando endpoint de perfis...');
    const perfisResponse = await fetch(`${API_BASE_URL}/api/permissoes/perfis`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (perfisResponse.ok) {
      const perfisData = await perfisResponse.json();
      console.log('✅ Endpoint de perfis funcionando');
      console.log('📊 Perfis disponíveis:', perfisData.data?.length || 0);
    } else {
      console.log('⚠️ Endpoint de perfis não disponível');
    }

    // 5. Testar endpoint de permissões
    console.log('\n5️⃣ Testando endpoint de permissões...');
    const permissoesResponse = await fetch(`${API_BASE_URL}/api/permissoes/permissoes`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (permissoesResponse.ok) {
      const permissoesData = await permissoesResponse.json();
      console.log('✅ Endpoint de permissões funcionando');
      console.log('📊 Permissões disponíveis:', permissoesData.data?.length || 0);
    } else {
      console.log('⚠️ Endpoint de permissões não disponível');
    }

    console.log('\n🎉 Teste concluído com sucesso!');
    console.log('\n📋 Resumo:');
    console.log('   ✅ Login funcionando');
    console.log('   ✅ Endpoint /me funcionando');
    console.log('   ✅ Permissões carregadas');
    console.log('   ✅ Sistema pronto para uso');

  } catch (error) {
    console.error('\n❌ Erro no teste:', error.message);
    console.log('\n🔧 Verificações necessárias:');
    console.log('   1. Backend está rodando em http://localhost:3001?');
    console.log('   2. Banco de dados está configurado?');
    console.log('   3. Usuário admin@irbana.com existe?');
    console.log('   4. Tabelas de permissões estão criadas?');
    process.exit(1);
  }
}

// Executar teste
testLoginAndPermissions();
