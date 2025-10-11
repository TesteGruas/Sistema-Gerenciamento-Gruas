// ============================================
// 🚀 IRBANA PWA SERVICE WORKER v3.0
// ============================================
// Implementa estratégias avançadas de cache,
// sincronização em background e push notifications

const VERSION = '3.1.0';
const CACHE_PREFIX = 'irbana-pwa';
const CACHE_STATIC = `${CACHE_PREFIX}-static-v${VERSION}`;
const CACHE_DYNAMIC = `${CACHE_PREFIX}-dynamic-v${VERSION}`;
const CACHE_API = `${CACHE_PREFIX}-api-v${VERSION}`;
const CACHE_IMAGES = `${CACHE_PREFIX}-images-v${VERSION}`;

// Tempo máximo de cache
const CACHE_MAX_AGE = {
  static: 30 * 24 * 60 * 60 * 1000, // 30 dias
  dynamic: 7 * 24 * 60 * 60 * 1000, // 7 dias
  api: 60 * 60 * 1000, // 1 hora
  images: 14 * 24 * 60 * 60 * 1000 // 14 dias
};

// Configurações
const CONFIG = {
  networkTimeout: 5000, // 5 segundos
  maxCacheSize: {
    dynamic: 100,
    api: 50,
    images: 100
  },
  debug: true // Desativar em produção
};

// Assets estáticos para cache (cache-first)
const STATIC_ASSETS = [
  '/',
  '/pwa',
  '/pwa/login',
  '/pwa/ponto',
  '/pwa/gruas',
  '/pwa/documentos',
  '/pwa/notificacoes',
  '/pwa/perfil',
  '/pwa/assinatura',
  '/pwa/encarregador',
  '/pwa/redirect',
  '/manifest.json'
];

// Rotas da API (network-first)
const API_ROUTES = [
  '/api/',
  'localhost:3001/api/',
  '127.0.0.1:3001/api/'
];

// ============================================
// 📝 UTILITÁRIOS
// ============================================

function log(...args) {
  if (CONFIG.debug) {
    console.log('[SW v' + VERSION + ']', ...args);
  }
}

function isApiRequest(url) {
  return API_ROUTES.some(route => url.includes(route));
}

function isImageRequest(url) {
  return /\.(jpg|jpeg|png|gif|webp|svg|ico)$/i.test(url);
}

function isStaticAsset(url) {
  const urlPath = new URL(url).pathname;
  return STATIC_ASSETS.some(asset => urlPath === asset || urlPath.startsWith(asset));
}

async function cleanCache(cacheName, maxSize) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  
  if (keys.length > maxSize) {
    log(`Limpando cache ${cacheName}: ${keys.length} → ${maxSize}`);
    const keysToDelete = keys.slice(0, keys.length - maxSize);
    await Promise.all(keysToDelete.map(key => cache.delete(key)));
  }
}

async function addTimestamp(response) {
  const clonedResponse = response.clone();
  const body = await clonedResponse.blob();
  
  return new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers: {
      ...Object.fromEntries(response.headers.entries()),
      'sw-cached-at': Date.now().toString()
    }
  });
}

async function isCacheExpired(response, maxAge) {
  const cachedAt = response.headers.get('sw-cached-at');
  if (!cachedAt) return true;
  
  const age = Date.now() - parseInt(cachedAt);
  return age > maxAge;
}

// ============================================
// 📦 ESTRATÉGIAS DE CACHE
// ============================================

// Estratégia 1: Cache First (para assets estáticos)
async function cacheFirst(request) {
  try {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      // Verificar se o cache expirou
      if (await isCacheExpired(cachedResponse, CACHE_MAX_AGE.static)) {
        log('Cache expirado, buscando da rede:', request.url);
        return networkFirst(request);
      }
      
      log('Cache hit (static):', request.url);
      return cachedResponse;
    }
    
    log('Cache miss (static), buscando da rede:', request.url);
    const networkResponse = await fetchWithTimeout(request);
    
    // Cachear a resposta
    const cache = await caches.open(CACHE_STATIC);
    cache.put(request, await addTimestamp(networkResponse.clone()));
    
    return networkResponse;
  } catch (error) {
    log('Erro em cacheFirst:', error);
    return new Response('Offline', { status: 503 });
  }
}

// Estratégia 2: Network First (para APIs)
async function networkFirst(request) {
  try {
    const networkResponse = await fetchWithTimeout(request);
    
    // Cachear apenas respostas bem-sucedidas
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_API);
      cache.put(request, await addTimestamp(networkResponse.clone()));
      
      // Limpar cache se necessário
      await cleanCache(CACHE_API, CONFIG.maxCacheSize.api);
    }
    
    log('Network hit (API):', request.url);
    return networkResponse;
  } catch (error) {
    log('Network falhou, tentando cache (API):', request.url);
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      log('Cache hit (API fallback):', request.url);
      return cachedResponse;
    }
    
    return new Response(JSON.stringify({ 
      error: 'Offline',
      message: 'Não foi possível conectar ao servidor'
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Estratégia 3: Stale While Revalidate (para dados semi-estáticos)
async function staleWhileRevalidate(request) {
  const cachedResponse = await caches.match(request);
  
  const fetchPromise = fetchWithTimeout(request)
    .then(async (networkResponse) => {
      if (networkResponse.ok) {
        const cache = await caches.open(CACHE_DYNAMIC);
        cache.put(request, await addTimestamp(networkResponse.clone()));
        await cleanCache(CACHE_DYNAMIC, CONFIG.maxCacheSize.dynamic);
        log('Revalidado:', request.url);
      }
      return networkResponse;
    })
    .catch(error => {
      log('Revalidação falhou:', request.url, error);
      return null;
    });
  
  if (cachedResponse) {
    log('Retornando cache (SWR):', request.url);
    return cachedResponse;
  }
  
  log('Aguardando rede (SWR):', request.url);
  return fetchPromise || new Response('Offline', { status: 503 });
}

// Estratégia 4: Cache para imagens
async function cacheImages(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    // Revalidar em background se expirou
    if (await isCacheExpired(cachedResponse, CACHE_MAX_AGE.images)) {
      fetchWithTimeout(request)
        .then(async (networkResponse) => {
          if (networkResponse.ok) {
            const cache = await caches.open(CACHE_IMAGES);
            cache.put(request, await addTimestamp(networkResponse.clone()));
          }
        })
        .catch(() => {});
    }
    
    log('Cache hit (image):', request.url);
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetchWithTimeout(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_IMAGES);
      cache.put(request, await addTimestamp(networkResponse.clone()));
      await cleanCache(CACHE_IMAGES, CONFIG.maxCacheSize.images);
    }
    
    log('Network hit (image):', request.url);
    return networkResponse;
  } catch (error) {
    log('Imagem não disponível:', request.url);
    return new Response('', { status: 503 });
  }
}

// Fetch com timeout
function fetchWithTimeout(request, timeout = CONFIG.networkTimeout) {
  return Promise.race([
    fetch(request),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Network timeout')), timeout)
    )
  ]);
}

// ============================================
// 🔧 EVENT HANDLERS
// ============================================

// INSTALL: Pré-cachear assets estáticos
self.addEventListener('install', (event) => {
  log('Instalando service worker...');
  
  event.waitUntil(
    caches.open(CACHE_STATIC)
      .then((cache) => {
        log('Cacheando assets estáticos...');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        log('Service worker instalado com sucesso!');
        // Forçar ativação imediata
        return self.skipWaiting();
      })
      .catch(error => {
        log('Erro ao instalar service worker:', error);
      })
  );
});

// ACTIVATE: Limpar caches antigos
self.addEventListener('activate', (event) => {
  log('Ativando service worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName.startsWith(CACHE_PREFIX) && !cacheName.includes(VERSION)) {
              log('Deletando cache antigo:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        log('Service worker ativado!');
        // Tomar controle de todas as páginas imediatamente
        return self.clients.claim();
      })
      .catch(error => {
        log('Erro ao ativar service worker:', error);
      })
  );
});

// FETCH: Interceptar requisições e aplicar estratégias
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = request.url;
  const urlPath = new URL(url).pathname;
  
  // Ignorar requisições não-GET e requisições de chrome-extension
  if (request.method !== 'GET' || url.includes('chrome-extension')) {
    return;
  }
  
  // ⚠️ IMPORTANTE: Apenas interceptar rotas do PWA
  // Deixar o dashboard e outras rotas passarem normalmente
  if (!urlPath.startsWith('/pwa')) {
    // Não interceptar - deixar a requisição passar normalmente
    return;
  }
  
  log('Interceptando requisição PWA:', urlPath);
  
  // Escolher estratégia baseada no tipo de requisição
  let strategyPromise;
  
  if (isApiRequest(url)) {
    // APIs: Network First com fallback para cache
    strategyPromise = networkFirst(request);
  } else if (isImageRequest(url)) {
    // Imagens: Cache com revalidação em background
    strategyPromise = cacheImages(request);
  } else if (isStaticAsset(url)) {
    // Assets estáticos: Cache First
    strategyPromise = cacheFirst(request);
  } else {
    // Outros: Stale While Revalidate
    strategyPromise = staleWhileRevalidate(request);
  }
  
  event.respondWith(strategyPromise);
});

// ============================================
// 🔄 BACKGROUND SYNC
// ============================================

self.addEventListener('sync', (event) => {
  log('Background sync triggered:', event.tag);
  
  if (event.tag.startsWith('sync-')) {
    event.waitUntil(syncData(event.tag));
  }
});

async function syncData(tag) {
  try {
    log('Sincronizando dados para tag:', tag);
    
    // Processar diferentes tipos de sincronização
    if (tag === 'sync-aprovacoes') {
      await syncAprovacoes();
    } else if (tag === 'sync-assinaturas') {
      await syncAssinaturas();
    } else if (tag === 'sync-ponto') {
      await syncPonto();
    } else {
      log('Tag de sincronização desconhecida:', tag);
    }
    
    log('Sincronização completa:', tag);
  } catch (error) {
    log('Erro na sincronização:', tag, error);
    throw error; // Retentar
  }
}

async function syncAprovacoes() {
  // Buscar fila de aprovações do IndexedDB ou localStorage
  // Como não temos acesso direto ao localStorage no SW,
  // enviaremos mensagem para os clientes
  const clients = await self.clients.matchAll();
  
  for (const client of clients) {
    client.postMessage({
      type: 'SYNC_APROVACOES'
    });
  }
}

async function syncAssinaturas() {
  const clients = await self.clients.matchAll();
  
  for (const client of clients) {
    client.postMessage({
      type: 'SYNC_ASSINATURAS'
    });
  }
}

async function syncPonto() {
  const clients = await self.clients.matchAll();
  
  for (const client of clients) {
    client.postMessage({
      type: 'SYNC_PONTO'
    });
  }
}

// ============================================
// 🔔 PUSH NOTIFICATIONS
// ============================================

self.addEventListener('push', (event) => {
  log('Push notification recebida');
  
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'IRBANA';
  const options = {
    body: data.body || 'Nova notificação',
    icon: data.icon || '/icon-192x192.png',
    badge: data.badge || '/icon-72x72.png',
    vibrate: data.vibrate || [200, 100, 200],
    data: data.data || {},
    actions: data.actions || [
      { action: 'open', title: 'Abrir' },
      { action: 'close', title: 'Fechar' }
    ],
    tag: data.tag || 'default',
    requireInteraction: data.requireInteraction || false,
    silent: data.silent || false
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  log('Notificação clicada:', event.action);
  
  event.notification.close();
  
  if (event.action === 'close') {
    return;
  }
  
  const urlToOpen = event.notification.data?.url || '/pwa';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Tentar focar em janela existente
        for (const client of clientList) {
          if (client.url.includes(urlToOpen) && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Abrir nova janela
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// ============================================
// 💬 MESSAGE HANDLER
// ============================================

self.addEventListener('message', (event) => {
  log('Mensagem recebida:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys()
        .then(cacheNames => {
          return Promise.all(
            cacheNames.map(cacheName => {
              if (cacheName.startsWith(CACHE_PREFIX)) {
                log('Limpando cache:', cacheName);
                return caches.delete(cacheName);
              }
            })
          );
        })
        .then(() => {
          event.ports[0].postMessage({ success: true });
        })
    );
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: VERSION });
  }
});

// ============================================
// 📊 ANALYTICS & DEBUG
// ============================================

// Contar cache hits/misses para analytics
let cacheStats = {
  hits: 0,
  misses: 0,
  errors: 0
};

// Resetar estatísticas a cada hora
setInterval(() => {
  if (CONFIG.debug) {
    log('Cache Stats:', cacheStats);
  }
  cacheStats = { hits: 0, misses: 0, errors: 0 };
}, 60 * 60 * 1000);

log('🚀 Service Worker carregado - versão', VERSION);
