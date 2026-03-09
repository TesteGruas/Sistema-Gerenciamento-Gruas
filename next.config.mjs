import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    // IMPORTANTE: Em produção no servidor, SEMPRE usar porta 3001
    // O rewrite redireciona /api/* para o backend na porta 3001
    
    let apiUrl = process.env.NEXT_PUBLIC_API_URL;
    
    // Se não estiver definida, usar fallback baseado no ambiente
    if (!apiUrl) {
      if (process.env.NODE_ENV === 'production') {
        // Em produção, SEMPRE usar o IP do servidor com porta 3001
        apiUrl = 'http://72.60.60.118:3001';
      } else {
        apiUrl = 'http://localhost:3001';
      }
    }
    
    // Remover /api do final se existir (o rewrite já adiciona)
    if (apiUrl.endsWith('/api')) {
      apiUrl = apiUrl.replace(/\/api$/, '');
    }
    
    // GARANTIR que está usando porta 3001 em produção
    // Se por algum motivo estiver usando porta 3000, forçar 3001
    if (process.env.NODE_ENV === 'production' && apiUrl.includes(':3000')) {
      apiUrl = apiUrl.replace(':3000', ':3001');
      console.warn('[Next.js Rewrite] ⚠️ Porta 3000 detectada, corrigindo para 3001');
    }
    
    // Log para debug
    if (process.env.NODE_ENV !== 'production') {
      console.log('[Next.js Rewrite] API URL configurada:', apiUrl);
    } else {
      console.log('[Next.js Rewrite] API URL (produção):', apiUrl);
    }
    
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },

  // ==================================
  // 📋 HEADERS (Cache e Segurança)
  // ==================================
  async headers() {
    return [
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
        // Service Worker
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
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
