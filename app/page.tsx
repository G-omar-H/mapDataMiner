'use client';

import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Search, Download, Filter, Database, Globe, Phone, Star, Building, Clock, Settings, FileSpreadsheet, Map, Pause, Play, X } from 'lucide-react';
import { BusinessData, SearchParams, ScrapingProgress, FilterOptions } from '@/types';
import { SSEScrapingClient } from '@/lib/sse-client';
import SearchForm from '@/components/SearchForm';
import InfiniteScrollBusinessTable from '@/components/InfiniteScrollBusinessTable';
import ProgressIndicator from '@/components/ProgressIndicator';
import ExportModal from '@/components/ExportModal';
import FilterSidebar from '@/components/FilterSidebar';
import MapView from '@/components/MapView';
import StatsCards from '@/components/StatsCards';
import ConfigurationCheck from '@/components/ConfigurationCheck';
import toast from 'react-hot-toast';

export default function HomePage() {
  const [isSearching, setIsSearching] = useState(false);
  const [searchProgress, setSearchProgress] = useState<ScrapingProgress | null>(null);
  const [businesses, setBusinesses] = useState<BusinessData[]>([]);
  const [filteredBusinesses, setFilteredBusinesses] = useState<BusinessData[]>([]);
  const [progress, setProgress] = useState<ScrapingProgress>({
    status: 'idle',
    currentStep: 'Ready to search',
    progress: 0,
    totalFound: 0,
    scraped: 0,
    errors: []
  });
  const [scrapingState, setScrapingState] = useState<'idle' | 'running' | 'paused' | 'cancelled'>('idle');
  const [showConfigCheck, setShowConfigCheck] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showFilterSidebar, setShowFilterSidebar] = useState(false);
  const [currentView, setCurrentView] = useState<'table' | 'map'>('table');
  const [searchParams, setSearchParams] = useState<SearchParams | null>(null);
  
  // Keep reference to SSE client for cleanup
  const sseClientRef = useRef<SSEScrapingClient | null>(null);

  // Control functions for pause/resume/cancel
  const handlePause = async () => {
    try {
      const response = await fetch('/api/scrape/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'pause' })
      });
      
      const result = await response.json();
      if (response.ok) {
        setScrapingState('paused');
        toast.success('Scraping paused');
      } else {
        toast.error(result.error || 'Failed to pause scraping');
      }
    } catch (error) {
      toast.error('Failed to pause scraping');
    }
  };

  const handleResume = async () => {
    try {
      const response = await fetch('/api/scrape/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resume' })
      });
      
      const result = await response.json();
      if (response.ok) {
        setScrapingState('running');
        toast.success('Scraping resumed');
      } else {
        toast.error(result.error || 'Failed to resume scraping');
      }
    } catch (error) {
      toast.error('Failed to resume scraping');
    }
  };

  const handleCancel = async () => {
    try {
      const response = await fetch('/api/scrape/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' })
      });
      
      const result = await response.json();
      if (response.ok) {
        setScrapingState('cancelled');
        setIsSearching(false);
        toast.success('Scraping cancelled');
      } else {
        toast.error(result.error || 'Failed to cancel scraping');
      }
    } catch (error) {
      toast.error('Failed to cancel scraping');
    }
  };

  const handleSearch = useCallback(async (params: SearchParams) => {
    // Update search params for map view
    setSearchParams(params);
    setScrapingState('running');
    
    setProgress({
      status: 'searching',
      currentStep: 'Initializing search...',
      progress: 0,
      totalFound: 0,
      scraped: 0,
      errors: []
    });

    // Clean up any existing SSE connection
    if (sseClientRef.current) {
      sseClientRef.current.abort();
    }

    // Create new SSE client for this search
    const sseClient = new SSEScrapingClient();
    sseClientRef.current = sseClient;

    try {
      await sseClient.startScraping(
        params, 
        // onProgress callback
        (progressUpdate) => {
          setProgress(progressUpdate);
          
          // Sync scraping state with progress status
          if (progressUpdate.status === 'scraping') {
            setScrapingState('running');
          } else if (progressUpdate.status === 'paused') {
            setScrapingState('paused');
          } else if (progressUpdate.status === 'cancelled') {
            setScrapingState('cancelled');
          } else if (progressUpdate.status === 'completed') {
            setScrapingState('idle');
          } else if (progressUpdate.status === 'error') {
            setScrapingState('idle');
          }
        }, 
        // onComplete callback
        (businessesData, warnings) => {
          setBusinesses(businessesData);
          setFilteredBusinesses(businessesData);
          setScrapingState('idle');
          
          if (warnings && warnings.length > 0) {
            toast(`Search completed with warnings: ${warnings.join(', ')}`, { duration: 6000 });
          } else {
            toast.success(`Found ${businessesData.length} businesses!`);
          }
        },
        // onError callback
        (error, message) => {
          console.error('Search failed:', error, message);
          setScrapingState('idle');
          setProgress(prev => ({
            ...prev,
            status: 'error',
            currentStep: 'Search failed',
            errors: [message]
          }));
          
          toast.error(`Search failed: ${message}`);
        }
      );
    } catch (error) {
      console.error('Search failed:', error);
      setScrapingState('idle');
      setProgress(prev => ({
        ...prev,
        status: 'error',
        currentStep: 'Search failed',
        errors: [(error as Error).message]
      }));
      
      toast.error('Search failed. Please try again.');
    }
  }, []);

  const handleFilter = useCallback((filters: FilterOptions) => {
    let filtered = [...businesses];

    if (filters.category) {
      filtered = filtered.filter(business => 
        business.category?.toLowerCase().includes(filters.category!.toLowerCase())
      );
    }

    if (filters.minRating) {
      filtered = filtered.filter(business => 
        business.rating && business.rating >= filters.minRating!
      );
    }

    if (filters.hasWebsite) {
      filtered = filtered.filter(business => business.website && business.website.length > 0);
    }

    if (filters.hasPhone) {
      filtered = filtered.filter(business => business.phone && business.phone.length > 0);
    }

    // Sort filtered results
    filtered.sort((a, b) => {
      let aValue: any = a[filters.sortBy as keyof BusinessData];
      let bValue: any = b[filters.sortBy as keyof BusinessData];

      if (typeof aValue === 'string') aValue = aValue.toLowerCase();
      if (typeof bValue === 'string') bValue = bValue.toLowerCase();

      if (filters.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredBusinesses(filtered);
  }, [businesses]);

  const stats = {
    total: businesses.length,
    withWebsite: businesses.filter(b => b.website).length,
    withPhone: businesses.filter(b => b.phone).length,
    avgRating: businesses.length > 0 
      ? businesses.reduce((sum, b) => sum + (b.rating || 0), 0) / businesses.filter(b => b.rating).length 
      : 0
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary-50 via-white to-primary-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-secondary-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-2 rounded-lg">
                <Database className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-secondary-900">MapDataMiner</h1>
                <p className="text-xs text-secondary-500">Professional Business Data Scraper</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowConfigCheck(true)}
                className="btn-secondary"
                title="Check Configuration"
              >
                <Settings className="h-4 w-4 mr-2" />
                Config
              </button>
              
              <button
                onClick={() => setCurrentView(currentView === 'table' ? 'map' : 'table')}
                className="btn-secondary"
              >
                {currentView === 'table' ? (
                  <>
                    <Map className="h-4 w-4 mr-2" />
                    Map View
                  </>
                ) : (
                  <>
                    <Database className="h-4 w-4 mr-2" />
                    Table View
                  </>
                )}
              </button>
              
              <button
                onClick={() => setShowFilterSidebar(true)}
                className="btn-secondary"
                disabled={businesses.length === 0}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </button>
              
              <button
                onClick={() => setShowExportModal(true)}
                className="btn-primary"
                disabled={filteredBusinesses.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <SearchForm onSearch={handleSearch} isLoading={progress.status === 'searching' || progress.status === 'scraping'} />
        </motion.div>

        {/* Progress Indicator */}
        <AnimatePresence>
          {(progress.status === 'searching' || progress.status === 'scraping' || progress.status === 'paused') && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8"
            >
              <ProgressIndicator progress={progress} />
              
              {/* Scraping Control Buttons */}
              {(progress.status === 'scraping' || progress.status === 'paused') && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 flex justify-center gap-3"
                >
                  {progress.status === 'scraping' && (
                    <button
                      onClick={handlePause}
                      className="flex items-center px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors duration-200"
                    >
                      <Pause className="h-4 w-4 mr-2" />
                      Pause
                    </button>
                  )}
                  
                  {progress.status === 'paused' && (
                    <button
                      onClick={handleResume}
                      className="flex items-center px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors duration-200"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Resume
                    </button>
                  )}
                  
                  <button
                    onClick={handleCancel}
                    className="flex items-center px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors duration-200"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats Cards */}
        {businesses.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <StatsCards stats={stats} />
          </motion.div>
        )}

        {/* Main Content */}
        <AnimatePresence mode="wait">
          {filteredBusinesses.length > 0 && (
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl shadow-soft border border-secondary-200 overflow-hidden"
            >
              {currentView === 'table' ? (
                <InfiniteScrollBusinessTable 
                  businesses={filteredBusinesses}
                />
              ) : (
                <MapView 
                  businesses={filteredBusinesses}
                  searchLocation={searchParams?.coordinates}
                  searchRadius={searchParams?.radius}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty State */}
        {businesses.length === 0 && progress.status === 'idle' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="bg-white rounded-xl shadow-soft border border-secondary-200 p-12">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                Ready to Mine Business Data
              </h3>
              <p className="text-secondary-500 mb-6 max-w-md mx-auto">
                Enter a location and category above to start extracting comprehensive business information from Google Maps.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
                <div className="text-center">
                  <Building className="h-6 w-6 text-primary-600 mx-auto mb-2" />
                  <p className="text-sm text-secondary-600">Business Names</p>
                </div>
                <div className="text-center">
                  <MapPin className="h-6 w-6 text-primary-600 mx-auto mb-2" />
                  <p className="text-sm text-secondary-600">Addresses</p>
                </div>
                <div className="text-center">
                  <Phone className="h-6 w-6 text-primary-600 mx-auto mb-2" />
                  <p className="text-sm text-secondary-600">Phone Numbers</p>
                </div>
                <div className="text-center">
                  <Globe className="h-6 w-6 text-primary-600 mx-auto mb-2" />
                  <p className="text-sm text-secondary-600">Websites</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Error State */}
        {progress.status === 'error' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-error-50 border border-error-200 rounded-xl p-6 text-center"
          >
            <div className="text-error-600 mb-4">
              <Settings className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-error-900 mb-2">
              Something went wrong
            </h3>
            <p className="text-error-700 mb-4">
              {progress.errors[0] || 'An unexpected error occurred while scraping data.'}
            </p>
            <button
              onClick={() => setProgress({ ...progress, status: 'idle' })}
              className="btn-secondary"
            >
              Try Again
            </button>
          </motion.div>
        )}
      </main>

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        businesses={filteredBusinesses}
      />

      {/* Filter Sidebar */}
      <FilterSidebar
        isOpen={showFilterSidebar}
        onClose={() => setShowFilterSidebar(false)}
        onFilter={handleFilter}
        businesses={businesses}
      />

      {/* Configuration Check Modal */}
      <ConfigurationCheck
        isOpen={showConfigCheck}
        onClose={() => setShowConfigCheck(false)}
      />
    </div>
  );
} 