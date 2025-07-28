# 🚀 Production Environment Setup - MapDataMiner

## 📋 **Required Environment Variables for Vercel**

Set these variables in **Vercel Dashboard → Project → Settings → Environment Variables**

---

## 🌍 **DEPLOYMENT CONFIGURATION**

```bash
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

---

## 🗺️ **REQUIRED: Google Maps API**

```bash
# Get from: https://console.cloud.google.com/apis/credentials
# Enable: Maps JavaScript API, Places API, Geocoding API
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

**Setup Instructions:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create API Key → Restrict to your domain
3. Enable required APIs: Maps JavaScript API, Places API, Geocoding API
4. Set billing limits to control costs

---

## 🗺️ **REQUIRED: Mapbox Access Token**

```bash
# Get from: https://account.mapbox.com/access-tokens/
# This is public (NEXT_PUBLIC_) - restrict to your domain
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.your_mapbox_access_token_here
```

**Setup Instructions:**
1. Go to [Mapbox Account](https://account.mapbox.com/access-tokens/)
2. Create new access token
3. Restrict to your domain for security
4. Token must start with `pk.`

---

## ⚙️ **PRODUCTION-OPTIMIZED SETTINGS**

```bash
# Search configuration (optimized for production)
DEFAULT_SEARCH_RADIUS=5000
MAX_BUSINESSES_PER_SEARCH=100

# Feature flags
ENABLE_REAL_SCRAPING=true
DEBUG_MODE=false

# Anti-detection scraping settings
SCRAPING_DELAY_MIN=2000
SCRAPING_DELAY_MAX=4000
MAX_CONCURRENT_SCRAPERS=2
SCRAPING_TIMEOUT=300000

# Security
API_SECRET_KEY=your_random_secret_key_minimum_32_characters
RATE_LIMIT_RPM=30
```

---

## 📊 **OPTIONAL: Google Sheets Integration**

```bash
# Only needed if you want Google Sheets export
GOOGLE_SHEETS_API_KEY=your_sheets_api_key
GOOGLE_CLIENT_EMAIL=service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY\n-----END PRIVATE KEY-----"
GOOGLE_PROJECT_ID=your-project-id
ENABLE_GOOGLE_SHEETS_EXPORT=true
```

**Setup Instructions:**
1. Go to [Service Accounts](https://console.cloud.google.com/iam-admin/serviceaccounts)
2. Create service account → Generate JSON key
3. Share your Google Sheet with the service account email
4. **Important**: Wrap private key in quotes and use `\n` for line breaks

---

## 🚀 **VERCEL DEPLOYMENT STEPS**

### **1. Set Environment Variables**
- Go to [Vercel Dashboard](https://vercel.com/dashboard)
- Click your project → Settings → Environment Variables
- Add each variable above
- **Important**: Set environment to **Production**, **Preview**, and **Development**

### **2. Redeploy After Adding Variables**
- Go to Deployments tab
- Click "..." → "Redeploy" on latest deployment

### **3. Test Your Deployment**
```bash
# Test these endpoints after deployment:
https://your-app.vercel.app/health          # Health check
https://your-app.vercel.app/                # Main app
```

---

## 💰 **COST OPTIMIZATION**

### **Google Maps API Costs:**
- **Geocoding API**: $5 per 1,000 requests
- **Places API**: $17 per 1,000 requests
- **Maps JavaScript API**: $7 per 1,000 loads

### **Optimization Tips:**
```bash
# Start with lower limits
MAX_BUSINESSES_PER_SEARCH=50
DEFAULT_SEARCH_RADIUS=3000

# Monitor usage at:
# https://console.cloud.google.com/billing
```

---

## 🔧 **TROUBLESHOOTING**

### **Map Not Loading:**
- ✅ Check `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` is set
- ✅ Verify token starts with `pk.`
- ✅ Check domain restrictions in Mapbox dashboard

### **Scraping Fails:**
- ✅ Verify `GOOGLE_MAPS_API_KEY` is configured
- ✅ Check API quotas in Google Cloud Console
- ✅ Ensure `ENABLE_REAL_SCRAPING=true`

### **Performance Issues:**
- ✅ Set `DEBUG_MODE=false` in production
- ✅ Reduce `MAX_BUSINESSES_PER_SEARCH`
- ✅ Increase `SCRAPING_DELAY_MIN`

---

## 🎯 **Production-Ready Checklist**

- [ ] **GOOGLE_MAPS_API_KEY** configured with billing limits
- [ ] **NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN** set with domain restrictions
- [ ] **API_SECRET_KEY** generated (32+ characters)
- [ ] **ENABLE_REAL_SCRAPING=true** for production
- [ ] **DEBUG_MODE=false** for performance
- [ ] All environment variables set in Vercel
- [ ] Application redeployed after env setup
- [ ] Health endpoint tested: `/health`
- [ ] Search functionality tested
- [ ] Map visualization working

---

## 🌟 **Your MapDataMiner is Production-Ready!**

Once all environment variables are configured, your application will be:
- ✅ **Fully functional** with real scraping capabilities
- ✅ **Optimized for production** with proper settings
- ✅ **Secure** with API key restrictions
- ✅ **Cost-effective** with sensible limits
- ✅ **Scalable** for thousands of users

**🚀 Start by setting the required variables and deploy!** 