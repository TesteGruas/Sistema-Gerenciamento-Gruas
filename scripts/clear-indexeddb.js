/**
 * Script para limpar o IndexedDB e forçar recriação
 * Execute no console do navegador para limpar dados corrompidos
 */

function clearPWASessionDB() {
  return new Promise((resolve, reject) => {
    // Deletar o banco existente
    const deleteRequest = indexedDB.deleteDatabase('PWASessionDB')
    
    deleteRequest.onsuccess = () => {
      console.log('✅ PWASessionDB deletado com sucesso')
      
      // Recriar o banco com a estrutura correta
      const createRequest = indexedDB.open('PWASessionDB', 1)
      
      createRequest.onupgradeneeded = (event) => {
        const db = event.target.result
        if (!db.objectStoreNames.contains('sessions')) {
          db.createObjectStore('sessions')
          console.log('✅ Object store "sessions" criado')
        }
      }
      
      createRequest.onsuccess = () => {
        console.log('✅ PWASessionDB recriado com sucesso')
        resolve()
      }
      
      createRequest.onerror = () => {
        console.error('❌ Erro ao recriar PWASessionDB:', createRequest.error)
        reject(createRequest.error)
      }
    }
    
    deleteRequest.onerror = () => {
      console.error('❌ Erro ao deletar PWASessionDB:', deleteRequest.error)
      reject(deleteRequest.error)
    }
    
    deleteRequest.onblocked = () => {
      console.warn('⚠️ Deletar PWASessionDB bloqueado - feche outras abas que usam o banco')
    }
  })
}

// Executar automaticamente se chamado diretamente
if (typeof window !== 'undefined') {
  clearPWASessionDB()
    .then(() => {
      console.log('🎉 Limpeza do IndexedDB concluída! Recarregue a página.')
    })
    .catch((error) => {
      console.error('💥 Erro na limpeza do IndexedDB:', error)
    })
}

// Exportar para uso manual
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { clearPWASessionDB }
}
