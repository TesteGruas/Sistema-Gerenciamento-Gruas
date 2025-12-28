#!/usr/bin/env node

/**
 * Script para diagnosticar a estrutura do @supabase/storage-js
 * e verificar se está instalado corretamente
 */

import { existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

async function main() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  const projectRoot = join(__dirname, '..');
  const nodeModulesPath = join(projectRoot, 'node_modules');
  const storageJsPath = join(nodeModulesPath, '@supabase', 'storage-js');

  console.log('🔍 Diagnóstico do @supabase/storage-js\n');
  console.log('📁 Caminhos verificados:');
  console.log(`   Project Root: ${projectRoot}`);
  console.log(`   node_modules: ${nodeModulesPath}`);
  console.log(`   storage-js: ${storageJsPath}\n`);

  // Verificar se node_modules existe
  if (!existsSync(nodeModulesPath)) {
    console.log('❌ node_modules não encontrado!');
    console.log('   Execute: npm install');
    process.exit(1);
  }

  console.log('✅ node_modules encontrado\n');

  // Verificar se @supabase existe
  const supabasePath = join(nodeModulesPath, '@supabase');
  if (!existsSync(supabasePath)) {
    console.log('❌ @supabase não encontrado!');
    console.log('   Execute: npm install');
    process.exit(1);
  }

  console.log('✅ @supabase encontrado\n');

  // Listar pacotes em @supabase
  console.log('📦 Pacotes em @supabase:');
  try {
    const supabasePackages = readdirSync(supabasePath);
    supabasePackages.forEach(pkg => {
      const pkgPath = join(supabasePath, pkg);
      const isDir = statSync(pkgPath).isDirectory();
      console.log(`   ${isDir ? '📁' : '📄'} ${pkg}`);
    });
  } catch (error) {
    console.log(`   ❌ Erro ao listar: ${error.message}`);
  }

  console.log('\n');

  // Verificar se storage-js existe
  if (!existsSync(storageJsPath)) {
    console.log('❌ @supabase/storage-js não encontrado!');
    console.log('   Isso pode ser normal se for uma dependência interna.');
    console.log('   Verificando estrutura do @supabase/supabase-js...\n');
    
    const supabaseJsPath = join(nodeModulesPath, '@supabase', 'supabase-js');
    if (existsSync(supabaseJsPath)) {
      console.log('✅ @supabase/supabase-js encontrado');
      console.log('   Verificando dependências...\n');
      
      const packageJsonPath = join(supabaseJsPath, 'package.json');
      if (existsSync(packageJsonPath)) {
        try {
          const fs = await import('fs');
          const packageJsonContent = await fs.promises.readFile(packageJsonPath, 'utf-8');
          const packageJson = JSON.parse(packageJsonContent);
          console.log('   Dependências do supabase-js:');
          if (packageJson.dependencies) {
            Object.keys(packageJson.dependencies).forEach(dep => {
              if (dep.includes('storage')) {
                console.log(`   📦 ${dep}: ${packageJson.dependencies[dep]}`);
              }
            });
          }
        } catch (error) {
          console.log(`   ⚠️  Erro ao ler package.json: ${error.message}`);
        }
      }
    }
    process.exit(1);
  }

  console.log('✅ @supabase/storage-js encontrado\n');

  // Explorar estrutura do storage-js
  console.log('📂 Estrutura do @supabase/storage-js:');
  function exploreDir(dir, depth = 0, maxDepth = 3) {
    if (depth > maxDepth) return;
    
    try {
      const items = readdirSync(dir);
      items.forEach(item => {
        const itemPath = join(dir, item);
        const indent = '  '.repeat(depth + 1);
        const stat = statSync(itemPath);
        
        if (stat.isDirectory()) {
          console.log(`${indent}📁 ${item}/`);
          if (item.includes('dist') || item.includes('src') || item.includes('packages') || depth < 2) {
            exploreDir(itemPath, depth + 1, maxDepth);
          }
        } else if (item.endsWith('.js') || item.endsWith('.json') || item.endsWith('.ts')) {
          console.log(`${indent}📄 ${item}`);
        }
      });
    } catch (error) {
      console.log(`${'  '.repeat(depth + 1)}❌ Erro: ${error.message}`);
    }
  }

  exploreDir(storageJsPath);

  // Verificar caminho específico que o usuário tentou acessar
  const targetPath = join(storageJsPath, 'dist', 'main', 'packages');
  console.log(`\n🎯 Verificando caminho específico: ${targetPath}`);
  if (existsSync(targetPath)) {
    console.log('✅ Caminho existe!');
    console.log('   Conteúdo:');
    try {
      const contents = readdirSync(targetPath);
      contents.forEach(item => {
        console.log(`   📄 ${item}`);
      });
    } catch (error) {
      console.log(`   ❌ Erro ao listar: ${error.message}`);
    }
  } else {
    console.log('❌ Caminho não existe');
    console.log('   Verificando alternativas...\n');
    
    // Tentar encontrar estrutura similar
    const distPath = join(storageJsPath, 'dist');
    if (existsSync(distPath)) {
      console.log('✅ dist/ encontrado');
      exploreDir(distPath, 0, 2);
    }
    
    const srcPath = join(storageJsPath, 'src');
    if (existsSync(srcPath)) {
      console.log('\n✅ src/ encontrado');
      exploreDir(srcPath, 0, 2);
    }
  }

  console.log('\n✨ Diagnóstico concluído!');
}

main().catch(console.error);

