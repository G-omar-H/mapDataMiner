/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['maps.googleapis.com', 'lh3.googleusercontent.com'],
  },
  env: {
    // Core API keys
    GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY,
    NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN,
    
    // Google Sheets API
    GOOGLE_CLIENT_EMAIL: process.env.GOOGLE_CLIENT_EMAIL,
    GOOGLE_PRIVATE_KEY: process.env.GOOGLE_PRIVATE_KEY,
    GOOGLE_PROJECT_ID: process.env.GOOGLE_PROJECT_ID,
    
    // Application settings
    DEFAULT_SEARCH_RADIUS: process.env.DEFAULT_SEARCH_RADIUS || '5000',
    MAX_BUSINESSES_PER_SEARCH: process.env.MAX_BUSINESSES_PER_SEARCH || '100',
    
    // Feature flags
    ENABLE_REAL_SCRAPING: process.env.ENABLE_REAL_SCRAPING || 'false',
    ENABLE_GOOGLE_SHEETS_EXPORT: process.env.ENABLE_GOOGLE_SHEETS_EXPORT || 'false',
    DEBUG_MODE: process.env.DEBUG_MODE || 'false',
    
    // Scraping configuration
    SCRAPING_DELAY_MIN: process.env.SCRAPING_DELAY_MIN || '1000',
    SCRAPING_DELAY_MAX: process.env.SCRAPING_DELAY_MAX || '3000',
    MAX_CONCURRENT_SCRAPERS: process.env.MAX_CONCURRENT_SCRAPERS || '3',
    SCRAPING_TIMEOUT: process.env.SCRAPING_TIMEOUT || '30000',
    
    // Security
    API_SECRET_KEY: process.env.API_SECRET_KEY,
    RATE_LIMIT_RPM: process.env.RATE_LIMIT_RPM || '10',
  },
  webpack: (config, { isServer }) => {
    // Server-side fallbacks for Node.js modules
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
      };
    }
    
    return config;
  },
  // Enable experimental features for better performance
  experimental: {
    // Mark Puppeteer packages as external for serverless deployment
    serverComponentsExternalPackages: [
      'puppeteer-core',
      'puppeteer',
      '@sparticuz/chromium'
    ],
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
  // Improve build performance
  swcMinify: true,
  // Enable React strict mode for development
  reactStrictMode: true,
};

module.exports = nextConfig; 