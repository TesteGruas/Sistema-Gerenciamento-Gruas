/**
 * Script para criar usuários de teste de cada tipo/role
 * 
 * Uso: node scripts/criar-usuarios-teste.js
 */

const API_BASE_URL = process.env.API_URL || 'http://72.60.60.118:3001';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsImtpZCI6ImIza0FDV3E2dGdIeTRmQWQiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL21naGRrdGtvZWpvYnNtZGJ2c3NsLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiI2YjNjZDVhOC0yOTkxLTQwYTItODIzNy1jNjRhZmM0MzEzMjAiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzYzMjA5OTk2LCJpYXQiOjE3NjMyMDYzOTYsImVtYWlsIjoiYWRtaW5AYWRtaW4uY29tIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJlbWFpbCIsInByb3ZpZGVycyI6WyJlbWFpbCJdfSwidXNlcl9tZXRhZGF0YSI6eyJlbWFpbCI6ImFkbWluQGFkbWluLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJub21lIjoiQWRtaW5pc3RyYWRvciIsInBob25lX3ZlcmlmaWVkIjpmYWxzZSwicm9sZSI6ImFkbWluIiwic3ViIjoiNmIzY2Q1YTgtMjk5MS00MGEyLTgyMzctYzY0YWZjNDMxMzIwIn0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoicGFzc3dvcmQiLCJ0aW1lc3RhbXAiOjE3NjMyMDYzOTZ9XSwic2Vzc2lvbl9pZCI6IjU3MWU1MDM1LTgwNDYtNDAyMy05ZWQ5LTUxYjliZGE3NTEzZCIsImlzX2Fub255bW91cyI6ZmFsc2V9.O7VvwmAGssjGYatvsDaAxxrC6bj3Mfio0CWSDhI8X5s';

// Definição dos tipos de usuários a serem criados
const usuariosParaCriar = [
  {
    nome: 'Administrador Teste',
    email: 'admin.teste@empresa.com',
    telefone: '11999999999',
    perfil_id: 1, // Admin
    senha: 'Admin123!',
    descricao: 'Usuário Administrador com acesso total ao sistema'
  },
  {
    nome: 'Gestor Teste',
    email: 'gestor.teste@empresa.com',
    telefone: '11999999998',
    perfil_id: 2, // Gestores
    senha: 'Gestor123!',
    descricao: 'Usuário Gestor com acesso gerencial completo'
  },
  {
    nome: 'Supervisor Teste',
    email: 'supervisor.teste@empresa.com',
    telefone: '11999999997',
    perfil_id: 3, // Supervisores
    senha: 'Supervisor123!',
    descricao: 'Usuário Supervisor com acesso operacional e de supervisão'
  },
  {
    nome: 'Operador Teste',
    email: 'operador.teste@empresa.com',
    telefone: '11999999996',
    perfil_id: 4, // Operadores
    senha: 'Operador123!',
    descricao: 'Usuário Operador com acesso básico para operação diária'
  },
  {
    nome: 'Cliente Teste',
    email: 'cliente.teste@empresa.com',
    telefone: '11999999995',
    perfil_id: 5, // Clientes
    senha: 'Cliente123!',
    descricao: 'Usuário Cliente com acesso limitado'
  },
  {
    nome: 'Financeiro Teste',
    email: 'financeiro.teste@empresa.com',
    telefone: '11999999994',
    perfil_id: 6, // Financeiro
    senha: 'Financeiro123!',
    descricao: 'Usuário Financeiro com acesso a gestão financeira, orçamentos e contratos'
  }
];

/**
 * Função para criar um usuário via API
 */
async function criarUsuario(dadosUsuario) {
  try {
    console.log(`\n📝 Criando usuário: ${dadosUsuario.nome} (${dadosUsuario.email})...`);
    
    const response = await fetch(`${API_BASE_URL}/api/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`
      },
      body: JSON.stringify({
        nome: dadosUsuario.nome,
        email: dadosUsuario.email,
        telefone: dadosUsuario.telefone,
        perfil_id: dadosUsuario.perfil_id,
        senha: dadosUsuario.senha,
        status: 'Ativo'
      })
    });

    const data = await response.json();

    if (!response.ok) {
      if (data.error && data.error.includes('already registered') || 
          data.message && data.message.includes('já cadastrado')) {
        console.log(`⚠️  Usuário ${dadosUsuario.email} já existe. Pulando...`);
        return { success: false, skipped: true, data };
      }
      throw new Error(data.message || data.error || `HTTP ${response.status}`);
    }

    console.log(`✅ Usuário criado com sucesso!`);
    console.log(`   ID: ${data.data?.id || 'N/A'}`);
    console.log(`   Email: ${data.data?.email || dadosUsuario.email}`);
    console.log(`   Perfil ID: ${dadosUsuario.perfil_id}`);
    console.log(`   Senha: ${dadosUsuario.senha}`);
    
    return { success: true, data: data.data };
  } catch (error) {
    console.error(`❌ Erro ao criar usuário ${dadosUsuario.email}:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Função principal
 */
async function main() {
  console.log('🚀 Iniciando criação de usuários de teste...');
  console.log(`📍 API URL: ${API_BASE_URL}`);
  console.log(`👤 Token: ${TOKEN.substring(0, 20)}...`);
  console.log(`\n📋 Total de usuários a criar: ${usuariosParaCriar.length}`);
  
  const resultados = [];
  
  for (let i = 0; i < usuariosParaCriar.length; i++) {
    const usuario = usuariosParaCriar[i];
    console.log(`\n${'='.repeat(60)}`);
    console.log(`[${i + 1}/${usuariosParaCriar.length}] ${usuario.descricao}`);
    console.log('='.repeat(60));
    
    const resultado = await criarUsuario(usuario);
    resultados.push({
      usuario: usuario.nome,
      email: usuario.email,
      perfil_id: usuario.perfil_id,
      ...resultado
    });
    
    // Aguardar 1 segundo entre requisições para evitar rate limiting
    if (i < usuariosParaCriar.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  // Resumo final
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMO DA CRIAÇÃO DE USUÁRIOS');
  console.log('='.repeat(60));
  
  const sucessos = resultados.filter(r => r.success);
  const falhas = resultados.filter(r => !r.success && !r.skipped);
  const pulados = resultados.filter(r => r.skipped);
  
  console.log(`\n✅ Sucessos: ${sucessos.length}`);
  sucessos.forEach(r => {
    console.log(`   - ${r.usuario} (${r.email}) - Perfil ID: ${r.perfil_id}`);
  });
  
  if (pulados.length > 0) {
    console.log(`\n⚠️  Pulados (já existem): ${pulados.length}`);
    pulados.forEach(r => {
      console.log(`   - ${r.usuario} (${r.email}) - Perfil ID: ${r.perfil_id}`);
    });
  }
  
  if (falhas.length > 0) {
    console.log(`\n❌ Falhas: ${falhas.length}`);
    falhas.forEach(r => {
      console.log(`   - ${r.usuario} (${r.email}): ${r.error || 'Erro desconhecido'}`);
    });
  }
  
  console.log(`\n📝 Credenciais dos usuários criados:`);
  console.log('='.repeat(60));
  sucessos.forEach(r => {
    const usuario = usuariosParaCriar.find(u => u.email === r.email);
    if (usuario) {
      console.log(`\n👤 ${usuario.nome}`);
      console.log(`   Email: ${usuario.email}`);
      console.log(`   Senha: ${usuario.senha}`);
      console.log(`   Perfil ID: ${usuario.perfil_id}`);
    }
  });
  
  console.log('\n✨ Processo concluído!');
}

// Executar o script
main().catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});

