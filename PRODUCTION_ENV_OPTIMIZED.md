# 🚀 Production-Optimized Environment Variables

Your current `.env.example` is comprehensive but needs optimization for Vercel production deployment. Here are the **critical fixes** needed:

## ❌ **Issues in Current .env.example**

1. **Wrong Mapbox variable name**: `MAPBOX_ACCESS_TOKEN` → Should be `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`
2. **Development defaults**: `ENABLE_REAL_SCRAPING=false` → Should be `true` for production
3. **Too many optional variables**: Confusing for basic deployment
4. **Missing Vercel-specific settings**
5. **Not production-optimized defaults**

## ✅ **Production-Optimized .env.example**

```bash
# ==============================================
# 🚀 MapDataMiner - Production Environment Variables
# ==============================================
# For Vercel: Set these in Dashboard → Project → Settings → Environment Variables

# ==============================================
# 🌍 DEPLOYMENT CONFIGURATION
# ==============================================
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app

# ==============================================
# 🗺️ REQUIRED: Google Maps API
# ==============================================
# Get from: https://console.cloud.google.com/apis/credentials
# Enable: Maps JavaScript API, Places API, Geocoding API
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# ==============================================
# 🗺️ REQUIRED: Mapbox Access Token (FIXED NAMING)
# ==============================================
# Get from: https://account.mapbox.com/access-tokens/
# ⚠️  MUST be NEXT_PUBLIC_ for client-side usage
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.your_mapbox_access_token_here

# ==============================================
# ⚙️ PRODUCTION-OPTIMIZED SETTINGS
# ==============================================
DEFAULT_SEARCH_RADIUS=5000
MAX_BUSINESSES_PER_SEARCH=100

# Feature flags (PRODUCTION SETTINGS)
ENABLE_REAL_SCRAPING=true
DEBUG_MODE=false

# Anti-detection scraping (PRODUCTION OPTIMIZED)
SCRAPING_DELAY_MIN=2000
SCRAPING_DELAY_MAX=4000
MAX_CONCURRENT_SCRAPERS=2
SCRAPING_TIMEOUT=300000

# Security
API_SECRET_KEY=your_random_secret_key_minimum_32_characters
RATE_LIMIT_RPM=30

# ==============================================
# 📊 OPTIONAL: Google Sheets Integration
# ==============================================
GOOGLE_SHEETS_API_KEY=your_sheets_api_key
GOOGLE_CLIENT_EMAIL=service-account@project.iam.gserviceaccount.com
GOOGLE_PROJECT_ID=your-project-id
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY\n-----END PRIVATE KEY-----"
ENABLE_GOOGLE_SHEETS_EXPORT=false

# ==============================================
# 🔧 VERCEL DEPLOYMENT VARIABLES
# ==============================================
VERCEL_REGION=auto
FUNCTION_TIMEOUT=300
NODE_OPTIONS=--max-old-space-size=1024
```

## 🔧 **Critical Changes Needed**

### 1. **Fix Mapbox Variable Name**
```bash
# ❌ WRONG (current)
MAPBOX_ACCESS_TOKEN=pk.your_mapbox_access_token_here

# ✅ CORRECT (production)
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.your_mapbox_access_token_here
```

### 2. **Production-Ready Defaults**
```bash
# ❌ WRONG (current - development defaults)
ENABLE_REAL_SCRAPING=false
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# ✅ CORRECT (production defaults)
ENABLE_REAL_SCRAPING=true
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

### 3. **Remove Unnecessary Variables**
Your current file has too many optional variables that confuse deployment:
- Remove database configs (not needed for basic deployment)
- Remove email/webhook configs (optional features)
- Remove analytics configs (can be added later)
- Keep only **essential** and **commonly used** variables

## 🚀 **Vercel Deployment Priority**

### **TIER 1: REQUIRED** ⚠️
```bash
GOOGLE_MAPS_API_KEY=your_key_here
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.your_token_here
```

### **TIER 2: RECOMMENDED** 🔧
```bash
API_SECRET_KEY=your_32_char_secret
ENABLE_REAL_SCRAPING=true
MAX_BUSINESSES_PER_SEARCH=100
DEFAULT_SEARCH_RADIUS=5000
```

### **TIER 3: OPTIONAL** 📊
```bash
# Google Sheets integration
GOOGLE_SHEETS_API_KEY=your_sheets_key
GOOGLE_CLIENT_EMAIL=service-account@project.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
```

## 📋 **Quick Fix Instructions**

1. **Update your .env.example** with the production-optimized version above
2. **Fix the Mapbox variable name** (`NEXT_PUBLIC_` prefix is critical)
3. **Set production defaults** (`ENABLE_REAL_SCRAPING=true`, etc.)
4. **Remove optional sections** that aren't needed for basic deployment
5. **Add Vercel-specific variables** for optimization

## 🎯 **Result**

With these changes, your `.env.example` will be:
- ✅ **Production-ready** with correct defaults
- ✅ **Vercel-optimized** with proper configurations
- ✅ **Streamlined** with only essential variables
- ✅ **Clear** with proper documentation and priorities
- ✅ **Secure** with production security settings

This will make deployment much easier and prevent common configuration errors! 🚀 