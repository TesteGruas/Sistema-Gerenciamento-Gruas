#!/usr/bin/env node

/**
 * 🔍 Diagnóstico do PWA
 * Script para identificar problemas comuns no PWA
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Iniciando diagnóstico do PWA...\n');

// Verificar arquivos essenciais
const essentialFiles = [
  'public/manifest.json',
  'public/sw.js',
  'app/pwa/layout.tsx',
  'app/pwa/page.tsx',
  'components/pwa-auth-guard.tsx',
  'components/service-worker-provider.tsx',
  'hooks/use-pwa-user.ts'
];

console.log('📁 Verificando arquivos essenciais:');
essentialFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`   ✅ ${file}`);
  } else {
    console.log(`   ❌ ${file} - ARQUIVO FALTANDO!`);
  }
});

// Verificar configurações do Next.js
console.log('\n⚙️ Verificando configurações do Next.js:');
if (fs.existsSync('next.config.mjs')) {
  const nextConfig = fs.readFileSync('next.config.mjs', 'utf8');
  
  if (nextConfig.includes('rewrites')) {
    console.log('   ✅ Rewrites configurados');
  } else {
    console.log('   ⚠️ Rewrites não encontrados - pode causar problemas com API');
  }
  
  if (nextConfig.includes('headers')) {
    console.log('   ✅ Headers configurados');
  } else {
    console.log('   ⚠️ Headers não encontrados - pode afetar cache do PWA');
  }
} else {
  console.log('   ❌ next.config.mjs não encontrado!');
}

// Verificar manifest.json
console.log('\n📱 Verificando manifest.json:');
if (fs.existsSync('public/manifest.json')) {
  try {
    const manifest = JSON.parse(fs.readFileSync('public/manifest.json', 'utf8'));
    
    if (manifest.name) {
      console.log(`   ✅ Nome: ${manifest.name}`);
    } else {
      console.log('   ❌ Nome não definido');
    }
    
    if (manifest.start_url) {
      console.log(`   ✅ Start URL: ${manifest.start_url}`);
    } else {
      console.log('   ❌ Start URL não definido');
    }
    
    if (manifest.icons && manifest.icons.length > 0) {
      console.log(`   ✅ Ícones: ${manifest.icons.length} encontrados`);
    } else {
      console.log('   ❌ Nenhum ícone encontrado');
    }
    
    if (manifest.display) {
      console.log(`   ✅ Display: ${manifest.display}`);
    } else {
      console.log('   ❌ Display não definido');
    }
  } catch (error) {
    console.log('   ❌ Erro ao ler manifest.json:', error.message);
  }
} else {
  console.log('   ❌ manifest.json não encontrado!');
}

// Verificar service worker
console.log('\n🔧 Verificando service worker:');
if (fs.existsSync('public/sw.js')) {
  const swContent = fs.readFileSync('public/sw.js', 'utf8');
  
  if (swContent.includes('addEventListener')) {
    console.log('   ✅ Event listeners encontrados');
  } else {
    console.log('   ❌ Event listeners não encontrados');
  }
  
  if (swContent.includes('caches')) {
    console.log('   ✅ Cache API utilizada');
  } else {
    console.log('   ❌ Cache API não utilizada');
  }
  
  if (swContent.includes('fetch')) {
    console.log('   ✅ Fetch interceptor encontrado');
  } else {
    console.log('   ❌ Fetch interceptor não encontrado');
  }
} else {
  console.log('   ❌ sw.js não encontrado!');
}

// Verificar variáveis de ambiente
console.log('\n🌍 Verificando variáveis de ambiente:');
if (fs.existsSync('.env.local')) {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  
  if (envContent.includes('NEXT_PUBLIC_API_URL')) {
    const apiUrlMatch = envContent.match(/NEXT_PUBLIC_API_URL=(.+)/);
    if (apiUrlMatch) {
      console.log(`   ✅ NEXT_PUBLIC_API_URL: ${apiUrlMatch[1]}`);
    }
  } else {
    console.log('   ❌ NEXT_PUBLIC_API_URL não encontrado');
  }
  
  if (envContent.includes('NEXT_PUBLIC_API_BASE_URL')) {
    const baseUrlMatch = envContent.match(/NEXT_PUBLIC_API_BASE_URL=(.+)/);
    if (baseUrlMatch) {
      console.log(`   ✅ NEXT_PUBLIC_API_BASE_URL: ${baseUrlMatch[1]}`);
    }
  } else {
    console.log('   ❌ NEXT_PUBLIC_API_BASE_URL não encontrado');
  }
} else {
  console.log('   ❌ .env.local não encontrado!');
  console.log('   💡 Execute: ./fix-pwa-env.sh para criar o arquivo');
}

// Verificar dependências
console.log('\n📦 Verificando dependências:');
if (fs.existsSync('package.json')) {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  const requiredDeps = [
    'next',
    'react',
    'react-dom',
    '@types/react',
    '@types/react-dom'
  ];
  
  requiredDeps.forEach(dep => {
    if (dependencies[dep]) {
      console.log(`   ✅ ${dep}: ${dependencies[dep]}`);
    } else {
      console.log(`   ❌ ${dep} não encontrado`);
    }
  });
} else {
  console.log('   ❌ package.json não encontrado!');
}

// Verificar estrutura de pastas PWA
console.log('\n📂 Verificando estrutura PWA:');
const pwaPaths = [
  'app/pwa',
  'app/pwa/login',
  'app/pwa/ponto',
  'app/pwa/documentos',
  'app/pwa/gruas',
  'app/pwa/notificacoes'
];

pwaPaths.forEach(pwaPath => {
  if (fs.existsSync(pwaPath)) {
    console.log(`   ✅ ${pwaPath}`);
  } else {
    console.log(`   ❌ ${pwaPath} - PASTA FALTANDO!`);
  }
});

// Verificar componentes PWA
console.log('\n🧩 Verificando componentes PWA:');
const pwaComponents = [
  'components/pwa-auth-guard.tsx',
  'components/pwa-install-prompt.tsx',
  'components/service-worker-provider.tsx',
  'components/offline-sync-indicator.tsx',
  'components/pwa-error-boundary.tsx'
];

pwaComponents.forEach(component => {
  if (fs.existsSync(component)) {
    console.log(`   ✅ ${component}`);
  } else {
    console.log(`   ❌ ${component} - COMPONENTE FALTANDO!`);
  }
});

// Verificar hooks PWA
console.log('\n🪝 Verificando hooks PWA:');
const pwaHooks = [
  'hooks/use-pwa-user.ts',
  'hooks/use-auth.ts',
  'hooks/use-permissions.ts'
];

pwaHooks.forEach(hook => {
  if (fs.existsSync(hook)) {
    console.log(`   ✅ ${hook}`);
  } else {
    console.log(`   ❌ ${hook} - HOOK FALTANDO!`);
  }
});

console.log('\n🎯 Resumo do diagnóstico:');
console.log('   • Verifique se todos os arquivos marcados com ❌ estão presentes');
console.log('   • Configure as variáveis de ambiente corretamente');
console.log('   • Certifique-se de que o backend está rodando');
console.log('   • Teste o PWA em um navegador com suporte a service workers');
console.log('   • Verifique o console do navegador para erros JavaScript');

console.log('\n🚀 Próximos passos:');
console.log('   1. Execute: ./fix-pwa-env.sh');
console.log('   2. Reinicie o servidor: npm run dev');
console.log('   3. Acesse: http://72.60.60.118:3000/pwa');
console.log('   4. Verifique o console do navegador para erros');

console.log('\n✅ Diagnóstico concluído!');
