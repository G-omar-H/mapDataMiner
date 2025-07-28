'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, MapPin, Phone, Globe, Star, Clock, ArrowUpDown, 
  ChevronLeft, ChevronRight, MoreHorizontal, ExternalLink,
  Filter, SortAsc, SortDesc, Eye, Loader2
} from 'lucide-react';
import { BusinessData } from '@/types';

interface InfiniteScrollBusinessTableProps {
  businesses: BusinessData[];
  loading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  itemsPerPage?: number;
}

type SortField = 'name' | 'rating' | 'reviewCount' | 'category' | 'distance';
type SortOrder = 'asc' | 'desc';

export default function InfiniteScrollBusinessTable({
  businesses,
  loading = false,
  hasMore = false,
  onLoadMore,
  itemsPerPage = 25
}: InfiniteScrollBusinessTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessData | null>(null);
  
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  // Filter and sort businesses
  const filteredAndSortedBusinesses = useMemo(() => {
    let filtered = businesses.filter(business =>
      business.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      business.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      business.category?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Sort businesses
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      // Handle special cases for sorting
      if (sortField === 'distance') {
        // If distance sorting is requested but not available, skip sorting
        return 0;
      } else {
        aValue = a[sortField as keyof BusinessData];
        bValue = b[sortField as keyof BusinessData];
      }

      if (typeof aValue === 'string') aValue = aValue.toLowerCase();
      if (typeof bValue === 'string') bValue = bValue.toLowerCase();

      if (aValue === undefined) aValue = '';
      if (bValue === undefined) bValue = '';

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [businesses, searchQuery, sortField, sortOrder]);

  // Paginated results
  const paginatedBusinesses = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedBusinesses.slice(0, startIndex + itemsPerPage);
  }, [filteredAndSortedBusinesses, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredAndSortedBusinesses.length / itemsPerPage);
  const hasNextPage = currentPage < totalPages;

  // Infinite scroll intersection observer
  useEffect(() => {
    if (!hasMore || loading || !onLoadMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading, onLoadMore]);

  // Handle sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  // Load more for pagination
  const loadMorePage = () => {
    if (hasNextPage && !loading) {
      setCurrentPage(prev => prev + 1);
    }
  };

  // Get rating stars
  const getRatingStars = (rating?: number) => {
    if (!rating) return '—';
    return '★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating));
  };

  // Format phone number
  const formatPhone = (phone?: string) => {
    if (!phone) return null;
    return phone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
  };

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center space-x-1 hover:text-primary-600 transition-colors"
    >
      <span>{children}</span>
      {sortField === field ? (
        sortOrder === 'asc' ? (
          <SortAsc className="h-3 w-3" />
        ) : (
          <SortDesc className="h-3 w-3" />
        )
      ) : (
        <ArrowUpDown className="h-3 w-3 opacity-40" />
      )}
    </button>
  );

  if (businesses.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="bg-secondary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <Search className="h-8 w-8 text-secondary-500" />
        </div>
        <h3 className="text-lg font-semibold text-secondary-900 mb-2">
          No businesses found
        </h3>
        <p className="text-secondary-500">
          Try adjusting your search criteria or expanding the search radius.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with search and controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold text-secondary-900">
            {filteredAndSortedBusinesses.length} Business{filteredAndSortedBusinesses.length !== 1 ? 'es' : ''}
          </h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                viewMode === 'table' 
                  ? 'bg-primary-100 text-primary-800' 
                  : 'text-secondary-600 hover:bg-secondary-100'
              }`}
            >
              Table
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                viewMode === 'cards' 
                  ? 'bg-primary-100 text-primary-800' 
                  : 'text-secondary-600 hover:bg-secondary-100'
              }`}
            >
              Cards
            </button>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search businesses..."
              className="pl-10 pr-4 py-2 border border-secondary-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>
      </div>

      {/* Results container */}
      <div ref={tableRef} className="bg-white rounded-lg border border-secondary-200 overflow-hidden">
        {viewMode === 'table' ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary-50 border-b border-secondary-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    <SortButton field="name">Business</SortButton>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    <SortButton field="rating">Rating</SortButton>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    <SortButton field="category">Category</SortButton>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-secondary-200">
                <AnimatePresence>
                  {paginatedBusinesses.map((business, index) => (
                    <motion.tr
                      key={business.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-secondary-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-secondary-900 truncate max-w-xs">
                            {business.name}
                          </div>
                          <div className="text-sm text-secondary-500 flex items-center mt-1">
                            <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                            <span className="truncate">{business.address}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {business.phone && (
                            <div className="text-sm text-secondary-900 flex items-center">
                              <Phone className="h-3 w-3 mr-1 flex-shrink-0" />
                              <a href={`tel:${business.phone}`} className="hover:text-primary-600">
                                {formatPhone(business.phone)}
                              </a>
                            </div>
                          )}
                          {business.website && (
                            <div className="text-sm text-secondary-900 flex items-center">
                              <Globe className="h-3 w-3 mr-1 flex-shrink-0" />
                              <a 
                                href={business.website} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="hover:text-primary-600 truncate max-w-xs"
                              >
                                Website
                              </a>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm text-secondary-900">
                            {business.rating ? (
                              <span className="flex items-center">
                                <Star className="h-3 w-3 text-yellow-400 mr-1" />
                                {business.rating.toFixed(1)}
                              </span>
                            ) : (
                              '—'
                            )}
                          </div>
                          {business.reviewCount && (
                            <div className="text-xs text-secondary-500">
                              {business.reviewCount} reviews
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                          {business.category || 'Business'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium">
                        <button
                          onClick={() => setSelectedBusiness(business)}
                          className="text-primary-600 hover:text-primary-900 mr-3"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {business.website && (
                          <a
                            href={business.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-secondary-400 hover:text-secondary-600"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        ) : (
          /* Cards View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            <AnimatePresence>
              {paginatedBusinesses.map((business, index) => (
                <motion.div
                  key={business.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white border border-secondary-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedBusiness(business)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-secondary-900 truncate flex-1">
                      {business.name}
                    </h3>
                    {business.rating && (
                      <div className="flex items-center text-sm text-secondary-600 ml-2">
                        <Star className="h-3 w-3 text-yellow-400 mr-1" />
                        {business.rating.toFixed(1)}
                      </div>
                    )}
                  </div>
                  
                  <div className="text-sm text-secondary-600 mb-2 flex items-start">
                    <MapPin className="h-3 w-3 mr-1 mt-0.5 flex-shrink-0" />
                    <span className="truncate">{business.address}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                      {business.category || 'Business'}
                    </span>
                    <div className="flex items-center space-x-2">
                      {business.phone && (
                        <a href={`tel:${business.phone}`} className="text-secondary-400 hover:text-secondary-600">
                          <Phone className="h-3 w-3" />
                        </a>
                      )}
                      {business.website && (
                        <a href={business.website} target="_blank" rel="noopener noreferrer" className="text-secondary-400 hover:text-secondary-600">
                          <Globe className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Loading more indicator */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary-600 mr-2" />
            <span className="text-secondary-600">Loading more businesses...</span>
          </div>
        )}

        {/* Load more button for pagination */}
        {hasNextPage && !hasMore && (
          <div className="flex justify-center py-6 border-t border-secondary-200">
            <button
              onClick={loadMorePage}
              disabled={loading}
              className="btn-secondary"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <MoreHorizontal className="h-4 w-4 mr-2" />
                  Show More ({Math.min(itemsPerPage, filteredAndSortedBusinesses.length - paginatedBusinesses.length)} more)
                </>
              )}
            </button>
          </div>
        )}

        {/* Infinite scroll trigger */}
        {hasMore && (
          <div ref={loadMoreRef} className="h-4" />
        )}
      </div>

      {/* Pagination info */}
      <div className="flex items-center justify-between text-sm text-secondary-600">
        <div>
          Showing {paginatedBusinesses.length} of {filteredAndSortedBusinesses.length} businesses
          {searchQuery && ` matching "${searchQuery}"`}
        </div>
        {totalPages > 1 && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-1 rounded hover:bg-secondary-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={!hasNextPage}
              className="p-1 rounded hover:bg-secondary-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Business Detail Modal */}
      <AnimatePresence>
        {selectedBusiness && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setSelectedBusiness(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-xl font-bold text-secondary-900">
                  {selectedBusiness.name}
                </h2>
                <button
                  onClick={() => setSelectedBusiness(null)}
                  className="text-secondary-400 hover:text-secondary-600"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <MapPin className="h-4 w-4 text-secondary-500 mt-1 mr-2 flex-shrink-0" />
                  <span className="text-secondary-700">{selectedBusiness.address}</span>
                </div>
                
                {selectedBusiness.phone && (
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 text-secondary-500 mr-2 flex-shrink-0" />
                    <a href={`tel:${selectedBusiness.phone}`} className="text-primary-600 hover:text-primary-700">
                      {formatPhone(selectedBusiness.phone)}
                    </a>
                  </div>
                )}
                
                {selectedBusiness.website && (
                  <div className="flex items-center">
                    <Globe className="h-4 w-4 text-secondary-500 mr-2 flex-shrink-0" />
                    <a 
                      href={selectedBusiness.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:text-primary-700 truncate"
                    >
                      Visit Website
                    </a>
                  </div>
                )}
                
                {selectedBusiness.rating && (
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-400 mr-2" />
                    <span className="text-secondary-700">
                      {selectedBusiness.rating.toFixed(1)} stars
                      {selectedBusiness.reviewCount && ` (${selectedBusiness.reviewCount} reviews)`}
                    </span>
                  </div>
                )}
                
                {selectedBusiness.hours && (
                  <div className="flex items-start">
                    <Clock className="h-4 w-4 text-secondary-500 mt-1 mr-2 flex-shrink-0" />
                    <span className="text-secondary-700">{selectedBusiness.hours}</span>
                  </div>
                )}
                
                <div className="pt-4 border-t border-secondary-200">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800">
                    {selectedBusiness.category || 'Business'}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
} 