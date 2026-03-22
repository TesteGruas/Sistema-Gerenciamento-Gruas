import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
/** Destino do proxy /api → backend (dev). Sobrescreva com BACKEND_URL se necessário. */
const LOCAL_API_ORIGIN = (process.env.BACKEND_URL || 'http://localhost:3001')
  .trim()
  .replace(/\/+$/, '')
  .replace(/\/api\/?$/, '');

/**
 * Evita loop: em dev, NEXT_PUBLIC_* às vezes aponta por engano para a porta do Next (3000).
 */
function shouldForceLocalBackend(apiUrl) {
  if (process.env.NODE_ENV === 'production') return false;
  try {
    const u = new URL(apiUrl);
    const port = u.port || (u.protocol === 'https:' ? '443' : '80');
    const isLocal =
      u.hostname === 'localhost' || u.hostname === '127.0.0.1' || u.hostname === '::1';
    if (!isLocal) return false;
    // Next dev padrão — não é o backend Express
    if (port === '3000') return true;
    if ((port === '80' || port === '443') && (u.hostname === 'localhost' || u.hostname === '127.0.0.1')) {
      // http://localhost sem porta explícita → 80, não é o backend típico
      return false;
    }
    return false;
  } catch {
    return false;
  }
}

function resolveRewriteApiOrigin() {
  const explicit = (process.env.BACKEND_URL || process.env.API_REWRITE_ORIGIN || '').trim();
  if (explicit) {
    return explicit.replace(/\/+$/, '').replace(/\/api\/?$/, '');
  }

  const fromEnv =
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    '';
  const sanitized = fromEnv.trim().replace(/\/api\/?$/, '');
  const isRelative = sanitized.startsWith('/');
  let apiUrl = isRelative ? LOCAL_API_ORIGIN : sanitized || LOCAL_API_ORIGIN;

  if (shouldForceLocalBackend(apiUrl)) {
    console.warn(
      '[Next.js Rewrite] NEXT_PUBLIC_API_* aponta para a porta do frontend; redirecionando API para',
      LOCAL_API_ORIGIN
    );
    return LOCAL_API_ORIGIN;
  }

  return apiUrl;
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Output standalone apenas em produção
  ...(process.env.NODE_ENV === 'production' ? { output: 'standalone' } : {}),
  
  // Resolver aviso de múltiplos lockfiles
  outputFileTracingRoot: __dirname,
  // ==================================
  // ⚡ OTIMIZAÇÕES DE PERFORMANCE
  // ==================================

  // Desabilitar source maps em produção para reduzir tamanho
  productionBrowserSourceMaps: false,

  // Remover header X-Powered-By
  poweredByHeader: false,

  // Ativar compressão
  compress: true,

  // ==================================
  // 🖼️ OTIMIZAÇÃO DE IMAGENS
  // ==================================
  images: {
    // Formatos modernos (WebP e AVIF)
    formats: ['image/webp', 'image/avif'],
    
    // Tamanhos de device
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    
    // Tamanhos de imagem
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    
    // Cache de 30 dias
    minimumCacheTTL: 60 * 60 * 24 * 30,
    
    // Permitir SVG com segurança
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    
    // Domínios externos permitidos (adicione conforme necessário)
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'irbana.com',
      }
    ],
  },

  // ==================================
  // 🔧 WEBPACK CUSTOMIZATION
  // ==================================
  webpack: (config, { dev, isServer }) => {
    // Otimizações de produção
    if (!dev && !isServer) {
      // Code splitting otimizado
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            
            // Chunk de vendors (node_modules)
            vendor: {
              name: 'vendor',
              chunks: 'all',
              test: /node_modules/,
              priority: 20,
              enforce: true,
            },
            
            // Chunk comum (código reutilizado)
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 10,
              reuseExistingChunk: true,
              enforce: true,
            },
            
            // Chunk de UI components
            ui: {
              name: 'ui',
              test: /[\\/]components[\\/]ui[\\/]/,
              chunks: 'all',
              priority: 30,
            },
            
            // Chunk de lib
            lib: {
              name: 'lib',
              test: /[\\/]lib[\\/]/,
              chunks: 'all',
              priority: 15,
            },
          },
        },
      };
    }

    return config;
  },

  // ==================================
  // ⚡ TURBOPACK CONFIGURATION
  // ==================================
  // Configuração do Turbopack (padrão no Next.js 16)
  // A configuração webpack acima será usada quando --webpack for explicitamente passado
  turbopack: {},

  // ==================================
  // 🚀 EXPERIMENTAL FEATURES
  // ==================================
  experimental: {
    // Otimizar importações de pacotes
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      '@radix-ui/react-toast',
    ],
    // Otimizar cache de servidor
    serverActions: {
      bodySizeLimit: '2mb',
    },
    // Otimizar renderização
    // optimizeCss: true, // Desabilitado temporariamente para evitar erro com critters
    // Permitir payloads maiores no proxy /api (uploads de documentos)
    middlewareClientMaxBodySize: '25mb',
  },

  // ==================================
  // 🔧 OUTPUT CONFIGURATION
  // ==================================
  // Output standalone apenas em produção (já definido no início do objeto)
  
  // Desabilitar strict mode temporariamente para evitar problemas de hidratação
  reactStrictMode: false,
  
  // ==================================
  // ⚡ OTIMIZAÇÕES ADICIONAIS
  // ==================================
  // Otimizar compilação
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // ==================================
  // 🔀 REWRITES (Proxy da API)
  // ==================================
  async rewrites() {
    const apiUrl = resolveRewriteApiOrigin();
    if (process.env.NODE_ENV !== 'production') {
      console.log('[Next.js Rewrite] /api →', `${apiUrl}/api/*`);
    }

    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
      // Socket.IO no mesmo origin que o front (evita URL vazia em produção com proxy only /api)
      {
        source: '/socket.io/:path*',
        destination: `${apiUrl}/socket.io/:path*`,
      },
    ];
  },

  // ==================================
  // 📋 HEADERS (Cache e Segurança)
  // ==================================
  async headers() {
    const isDev = process.env.NODE_ENV === 'development';

    return [
      ...(isDev
        ? [
            {
              source: '/pwa/:path*',
              headers: [
                {
                  key: 'Cache-Control',
                  value: 'no-store, no-cache, must-revalidate, max-age=0',
                },
              ],
            },
          ]
        : []),
      {
        // Headers específicos para arquivos estáticos do Next.js - DEVE VIR PRIMEIRO
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Headers específicos para CSS - NÃO definir Content-Type (Next.js faz isso automaticamente)
        source: '/_next/static/:path*.css',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Headers específicos para JavaScript do Next.js - NÃO definir Content-Type
        source: '/_next/static/:path*.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Aplicar headers a todos os arquivos estáticos de mídia
        source: '/:all*(svg|jpg|jpeg|png|gif|ico|webp|avif|woff|woff2|ttf|otf)',
        locale: false,
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Service Worker (em dev: no-store para o browser puxar sempre a versão nova)
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: isDev
              ? 'no-store, no-cache, must-revalidate, max-age=0'
              : 'public, max-age=0, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
      {
        // Headers de segurança para páginas (não arquivos estáticos) - DEVE VIR POR ÚLTIMO
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },

  // ==================================
  // ⚠️ BUILD CONFIGURATION
  // ==================================
  
  // Ignorar erros durante build (REMOVER EM PRODUÇÃO)
  // eslint config removido - usar next lint diretamente
  typescript: {
    ignoreBuildErrors: true,
  },

  // ==================================
  // 📱 PWA CONFIGURATION
  // ==================================
  
  // Garantir que manifest e service worker sejam servidos corretamente
  async redirects() {
    return [];
  },
};

export default nextConfig;
