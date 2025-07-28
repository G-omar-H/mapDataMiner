# 🚀 MapDataMiner - Vercel Deployment Guide

## 📋 **Pre-Deployment Checklist**

- ✅ Professional `.gitignore` file created
- ✅ Production build tested successfully
- ✅ Vercel configuration (`vercel.json`) ready
- ✅ Environment variables documented

---

## 🌐 **Environment Variables Setup**

### **Required Variables (Set in Vercel Dashboard):**

#### **🗺️ Google Maps API**
```bash
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```
- **Get from**: [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
- **Required for**: Business scraping functionality

#### **🗺️ Mapbox Access Token**
```bash
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.your_mapbox_access_token_here
```
- **Get from**: [Mapbox Account](https://account.mapbox.com/access-tokens/)
- **Required for**: Interactive map visualization

### **Optional Variables:**

#### **📊 Google Sheets Integration**
```bash
GOOGLE_SHEETS_API_KEY=your_google_sheets_api_key_here
GOOGLE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY\n-----END PRIVATE KEY-----"
GOOGLE_PROJECT_ID=your-google-project-id
```

#### **⚙️ Application Settings**
```bash
DEFAULT_SEARCH_RADIUS=5000
MAX_BUSINESSES_PER_SEARCH=100
ENABLE_REAL_SCRAPING=true
ENABLE_GOOGLE_SHEETS_EXPORT=false
DEBUG_MODE=false
SCRAPING_DELAY_MIN=2000
SCRAPING_DELAY_MAX=4000
MAX_CONCURRENT_SCRAPERS=3
SCRAPING_TIMEOUT=60000
API_SECRET_KEY=your_random_secret_key_here
RATE_LIMIT_RPM=60
```

---

## 🚀 **Vercel Deployment Steps**

### **1. Install Vercel CLI**
```bash
npm i -g vercel
```

### **2. Login to Vercel**
```bash
vercel login
```

### **3. Deploy to Vercel**
```bash
vercel --prod
```

### **4. Set Environment Variables**
Go to Vercel Dashboard → Your Project → Settings → Environment Variables

**Add each variable with these settings:**
- **Environment**: Production, Preview, Development
- **Value**: Your actual API keys/tokens

---

## 📚 **Git Repository Setup**

### **Initialize Repository:**
```bash
git init
git add .
git commit -m "🚀 Initial commit: Professional MapDataMiner with polished map interface"
```

### **Add Remote Repository:**
```bash
# Replace with your repository URL
git remote add origin https://github.com/yourusername/mapDataMiner.git
git branch -M main
git push -u origin main
```

---

## 🔧 **Vercel Configuration Features**

### **Performance Optimizations:**
- ✅ **5-minute timeout** for scraping operations
- ✅ **Cache headers** for API responses
- ✅ **Health check endpoint** (`/health`)

### **Environment Handling:**
- ✅ **Build-time** environment variables
- ✅ **Runtime** environment variables
- ✅ **Client-side** variables with `NEXT_PUBLIC_` prefix

---

## 🛡️ **Security Best Practices**

### **API Keys Protection:**
- ✅ All sensitive keys in environment variables
- ✅ Private keys properly escaped with `\n`
- ✅ Client-side variables clearly marked
- ✅ `.env.local` excluded from repository

### **Rate Limiting:**
- ✅ Configurable rate limits
- ✅ Scraping delays to prevent blocking
- ✅ Timeout configurations

---

## 🎯 **Post-Deployment Testing**

### **1. Health Check**
Visit: `https://your-app.vercel.app/health`

### **2. Configuration Status**
- Click "Config" button in the app
- Verify all API integrations

### **3. Functionality Tests**
- ✅ Search functionality
- ✅ Map visualization
- ✅ Business data scraping
- ✅ Export features

---

## 🔍 **Troubleshooting**

### **Common Issues:**

#### **Map Not Loading**
- Check `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` is set
- Verify token is valid and has proper permissions

#### **Scraping Not Working**
- Verify `GOOGLE_MAPS_API_KEY` is configured
- Check `ENABLE_REAL_SCRAPING=true`
- Ensure API quota is not exceeded

#### **Build Failures**
- Check for TypeScript errors: `npm run build`
- Verify all dependencies are installed
- Check Next.js configuration

---

## 📊 **Performance Monitoring**

### **Vercel Analytics:**
- Enable in Vercel Dashboard
- Monitor page load times
- Track user interactions

### **API Monitoring:**
- Check function execution times
- Monitor error rates
- Track scraping success rates

---

## 🎉 **Deployment Complete!**

Your MapDataMiner is now ready for production with:
- ✅ **Professional deployment configuration**
- ✅ **Optimized build settings**
- ✅ **Secure environment handling**
- ✅ **Production-ready performance**

**🌐 Access your deployed app at: `https://your-app.vercel.app`**

---

## 📞 **Support**

For deployment issues:
1. Check Vercel build logs
2. Verify environment variables
3. Test build locally: `npm run build`
4. Check API key permissions 