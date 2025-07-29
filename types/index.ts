export interface BusinessData {
  id: string;
  name: string;
  address: string;
  phone?: string;
  website?: string;
  rating?: number;
  reviewCount?: number;
  category?: string;
  hours?: string;
  priceLevel?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  placeId?: string;
  photos?: string[];
  description?: string;
  scrapedAt: Date;
}

export interface SearchParams {
  location: string;
  categories: string[];
  radius: number;
  coordinates?: { lat: number; lng: number };
  maxResults: number;
  searchMode: 'preview' | 'full' | 'unlimited';
}

export interface ScrapingProgress {
  status: 'idle' | 'searching' | 'scraping' | 'paused' | 'cancelled' | 'completed' | 'error';
  currentStep: string;
  progress: number;
  totalFound: number;
  scraped: number;
  errors: string[];
}

export interface ExportOptions {
  format: 'csv' | 'xlsx';
  includePhotos: boolean;
  selectedFields: string[];
}

export interface GoogleSheetsConfig {
  spreadsheetId?: string;
  sheetName: string;
  credentials?: any;
}

export interface MapViewport {
  latitude: number;
  longitude: number;
  zoom: number;
}

export interface FilterOptions {
  category?: string;
  minRating?: number;
  hasWebsite?: boolean;
  hasPhone?: boolean;
  sortBy: 'name' | 'rating' | 'reviewCount' | 'category' | 'distance';
  sortOrder: 'asc' | 'desc';
} 