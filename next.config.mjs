/** @type {import('next').NextConfig} */
const nextConfig = {
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
  },
  
  // ==================================
  // ⚡ OTIMIZAÇÕES ADICIONAIS
  // ==================================
  // Reduzir tamanho do bundle
  swcMinify: true,
  
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
    // Usar variável de ambiente ou fallback para localhost em desenvolvimento
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 
                   (process.env.NODE_ENV === 'production' 
                     ? 'http://72.60.60.118:3001' 
                     : 'http://localhost:3001');
    
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
        // Aplicar headers a todos os arquivos estáticos
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
        // Headers específicos para CSS - usar padrão mais específico
        source: '/_next/static/:path*.css',
        headers: [
          {
            key: 'Content-Type',
            value: 'text/css; charset=utf-8',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Headers específicos para JavaScript
        source: '/:all*.js',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript; charset=utf-8',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Headers de segurança para todas as páginas
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
    ];
  },

  // ==================================
  // ⚠️ BUILD CONFIGURATION
  // ==================================
  
  // Ignorar erros durante build (REMOVER EM PRODUÇÃO)
  eslint: {
    ignoreDuringBuilds: true,
  },
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
