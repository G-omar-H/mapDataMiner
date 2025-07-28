# 🔑 API Setup Guide for MapDataMiner

This guide will help you obtain all the necessary API keys and configure your environment variables.

## 📋 Quick Setup Steps

1. **Copy the example file:**
   ```bash
   cp .env.example .env.local
   ```

2. **Get your API keys** (see detailed instructions below)

3. **Edit `.env.local`** with your actual values

4. **Restart your development server**

---

## 🗺️ Google Maps API Setup

### Step 1: Create a Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Note your **Project ID**

### Step 2: Enable APIs
Enable these APIs in your project:
- **Maps JavaScript API**
- **Places API** 
- **Geocoding API**
- **Google Sheets API** (for export feature)
- **Google Drive API** (for Sheets integration)

### Step 3: Create API Key
1. Go to **Credentials** → **Create Credentials** → **API Key**
2. Copy the API key
3. **Restrict the key** (recommended):
   - **Application restrictions**: HTTP referrers
   - **API restrictions**: Select the APIs you enabled

### Step 4: Add to .env.local
```env
GOOGLE_MAPS_API_KEY=AIzaSyBkVoL_YourActualAPIKeyHere
GOOGLE_PROJECT_ID=your-project-id
```

---

## 🗺️ Mapbox Setup (for Map Visualization)

### Step 1: Create Mapbox Account
1. Go to [Mapbox](https://account.mapbox.com/)
2. Sign up for free account

### Step 2: Get Access Token
1. Go to **Access Tokens**
2. Copy your **Default public token**
3. Or create a new token with these scopes:
   - `styles:read`
   - `fonts:read`
   - `datasets:read`

### Step 3: Add to .env.local
```env
MAPBOX_ACCESS_TOKEN=pk.eyJ1IjoieW91ci11c2VyIiwiYSI6InlvdXItdG9rZW4ifQ.your-token-here
```

---

## 📊 Google Sheets API Setup (Optional)

### Step 1: Create Service Account
1. In Google Cloud Console, go to **IAM & Admin** → **Service Accounts**
2. Click **Create Service Account**
3. Give it a name (e.g., "mapdataminer-sheets")
4. Click **Create and Continue**

### Step 2: Create JSON Key
1. Click on your service account
2. Go to **Keys** tab
3. Click **Add Key** → **Create New Key** → **JSON**
4. Download the JSON file

### Step 3: Share Google Sheets
For any Google Sheet you want to write to:
1. Open the sheet
2. Click **Share**
3. Add your service account email (from JSON file)
4. Give it **Editor** permissions

### Step 4: Add to .env.local
```env
GOOGLE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_FROM_JSON\n-----END PRIVATE KEY-----\n"
```

**⚠️ Important**: Keep the exact formatting of the private key with `\n` characters!

---

## ⚡ Quick Start (Minimum Required)

For **basic functionality** with mock data, you only need:

```env
# Minimum required for development
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
ENABLE_REAL_SCRAPING=false

# Add these when ready for production
# GOOGLE_MAPS_API_KEY=your_key_here
# MAPBOX_ACCESS_TOKEN=your_token_here
```

---

## 🔧 Configuration Options

### Scraping Behavior
```env
# Control scraping speed and limits
SCRAPING_DELAY_MIN=1000          # Minimum delay between requests
SCRAPING_DELAY_MAX=3000          # Maximum delay between requests
MAX_BUSINESSES_PER_SEARCH=100    # Limit results per search
```

### Feature Toggles
```env
ENABLE_REAL_SCRAPING=true        # Enable actual Google Maps scraping
ENABLE_GOOGLE_SHEETS_EXPORT=true # Enable direct Sheets export
DEBUG_MODE=true                  # Enable debug logging
```

---

## 🚨 Important Security Notes

1. **Never commit `.env.local`** to version control
2. **Restrict your API keys** to your domain/IP
3. **Use different keys** for development and production
4. **Monitor API usage** to avoid unexpected charges
5. **Rotate keys periodically** for security

---

## 💰 Cost Considerations

### Google Maps API
- **Free tier**: 28,000 map loads per month
- **Places API**: $17 per 1,000 requests after free tier
- **Geocoding**: $5 per 1,000 requests after free tier

### Mapbox
- **Free tier**: 50,000 map loads per month
- Additional usage starts at $5 per 1,000 loads

### Google Sheets API
- **Free**: 300 requests per minute per project
- **Paid**: Higher quotas available

---

## 🔍 Testing Your Setup

1. **Start the server:**
   ```bash
   npm run dev
   ```

2. **Check the console** for any API key errors

3. **Test features:**
   - Search functionality (works with mock data)
   - Map visualization (requires Mapbox token)
   - Google Sheets export (requires Sheets API setup)

---

## 🆘 Troubleshooting

### Common Issues

**"API key not valid"**
- Check if the API is enabled in Google Cloud Console
- Verify API key restrictions
- Make sure the key is copied correctly

**"Quota exceeded"**
- Check your API usage in Google Cloud Console
- Consider upgrading to paid plan
- Implement rate limiting

**"Sheets API error"**
- Verify service account email is shared with the sheet
- Check private key formatting (keep `\n` characters)
- Ensure Sheets API is enabled

---

## 📞 Support

If you need help:
1. Check the error messages in browser console
2. Verify API keys in Google Cloud Console
3. Test with minimal configuration first
4. Review the API documentation links above

**Happy scraping! 🚀**
