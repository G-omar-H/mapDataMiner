# 🗂️ MapDataMiner

**Professional Business Data Scraper for Google Maps**

MapDataMiner is a powerful, modern web application designed to extract comprehensive business data from Google Maps with advanced filtering, sorting, and export capabilities. Perfect for lead generation, market research, and business intelligence.

![MapDataMiner Interface](https://via.placeholder.com/800x400/3b82f6/ffffff?text=MapDataMiner+Interface)

## ✨ Features

### 🎯 Advanced Search & Scraping
- **Location-based Search**: Search by city, address, or coordinates
- **Category Filtering**: Target specific business types (restaurants, hotels, etc.)
- **Radius Control**: Adjustable search radius from 0.5km to 50km
- **Smart Data Extraction**: Comprehensive business information including:
  - Business names and addresses
  - Phone numbers and websites
  - Ratings and review counts
  - Operating hours and categories
  - GPS coordinates

### 📊 Data Management
- **Real-time Progress Tracking**: Visual progress indicators during scraping
- **Advanced Filtering**: Filter by rating, contact info, category
- **Smart Sorting**: Sort by name, rating, review count, or distance
- **Search & Pagination**: Efficient browsing of large datasets

### 📈 Visualization & Analysis
- **Interactive Table View**: Sortable, searchable business listings
- **Map Visualization**: Geographic view of business locations
- **Statistics Dashboard**: Key metrics and insights
- **Responsive Design**: Perfect on desktop, tablet, and mobile

### 📤 Export Capabilities
- **CSV Export**: Download data as spreadsheet-compatible files
- **Google Sheets Integration**: Direct export to Google Sheets
- **Customizable Fields**: Choose which data to include
- **Batch Operations**: Handle large datasets efficiently

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Modern web browser
- (Optional) Google Maps API key for enhanced features
- (Optional) Google Sheets API credentials for direct export

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/mapDataMiner.git
   cd mapDataMiner
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` with your API keys:
   ```env
   GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
   MAPBOX_ACCESS_TOKEN=your_mapbox_access_token_here
   GOOGLE_SHEETS_API_KEY=your_google_sheets_api_key_here
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## 🛠️ Technology Stack

### Frontend
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Modern utility-first styling
- **Framer Motion**: Smooth animations and transitions
- **React Hook Form**: Efficient form handling
- **Zod**: Runtime type validation

### Backend & Scraping
- **Puppeteer**: Headless browser automation
- **Next.js API Routes**: Serverless API endpoints
- **Google APIs**: Maps and Sheets integration

### Data & Export
- **CSV Writer**: Spreadsheet export functionality
- **Google Sheets API**: Direct cloud export
- **Real-time Progress**: WebSocket-like updates

## 📖 Usage Guide

### 1. Basic Search
1. Enter a location (city, address, or coordinates)
2. Choose a business category (optional)
3. Click "Start Mining Data"
4. Watch real-time progress as data is extracted

### 2. Advanced Search Options
- **Search Radius**: Adjust the area to search within
- **Results Limit**: Control how many businesses to find
- **Quality Filters**: Only include rated businesses or those with contact info

### 3. Filtering Results
- Use the **Filters** sidebar to refine results
- Filter by category, minimum rating, or contact information
- Sort results by name, rating, or review count

### 4. Viewing Data
- **Table View**: Detailed list with sortable columns
- **Map View**: Geographic visualization of business locations
- **Statistics**: Overview of key metrics

### 5. Exporting Data
1. Click the **Export Data** button
2. Choose format (CSV or Google Sheets)
3. Select which fields to include
4. Download or save to Google Sheets

## 🔧 Configuration

### Google Maps API Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable the Google Maps JavaScript API
4. Create an API key and add to `.env.local`

### Google Sheets API Setup
1. Enable Google Sheets API in Google Cloud Console
2. Create a service account
3. Download the JSON credentials file
4. Add credentials to `.env.local`

### Environment Variables
```env
# Required for enhanced map features
GOOGLE_MAPS_API_KEY=your_api_key

# Required for map visualization
MAPBOX_ACCESS_TOKEN=your_token

# Required for Google Sheets export
GOOGLE_SHEETS_API_KEY=your_key
GOOGLE_CLIENT_EMAIL=service_account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Optional configurations
SCRAPING_DELAY_MIN=1000
SCRAPING_DELAY_MAX=3000
MAX_CONCURRENT_SCRAPERS=3
```

## 🎨 Customization

### Styling
- Modify `tailwind.config.js` for custom colors and styles
- Update `app/globals.css` for global styling changes
- Component styles are in individual component files

### Business Categories
Edit the `businessCategories` array in `components/SearchForm.tsx`:
```typescript
const businessCategories = [
  { value: 'custom-category', label: 'Custom Category' },
  // ... add more categories
];
```

### Export Fields
Customize available export fields in `components/ExportModal.tsx`:
```typescript
const availableFields = [
  { id: 'custom-field', label: 'Custom Field', required: false },
  // ... add more fields
];
```

## 🚢 Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically

### Docker
```bash
# Build the image
docker build -t mapdataminer .

# Run the container
docker run -p 3000:3000 mapdataminer
```

### Manual Deployment
```bash
# Build for production
npm run build

# Start production server
npm start
```

## ⚠️ Important Notes

### Legal & Ethical Usage
- **Respect Rate Limits**: The scraper includes delays to prevent overloading servers
- **Terms of Service**: Ensure compliance with Google Maps Terms of Service
- **Data Privacy**: Handle scraped data responsibly and in compliance with applicable laws
- **Commercial Use**: Review licensing requirements for commercial applications

### Performance Considerations
- **Large Datasets**: Use pagination and filtering for better performance
- **Memory Usage**: Monitor memory consumption with large scraping operations
- **API Limits**: Be aware of Google API quotas and billing

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check this README and inline code comments
- **Issues**: Report bugs or request features via GitHub Issues
- **Discussions**: Join community discussions in GitHub Discussions

## 🙏 Acknowledgments

- **Next.js Team**: For the amazing React framework
- **Tailwind CSS**: For the utility-first CSS framework
- **Puppeteer Team**: For the powerful browser automation tool
- **Community**: For feedback, suggestions, and contributions

---

**Made with ❤️ for the business intelligence community**

*MapDataMiner - Turning location data into business insights* 