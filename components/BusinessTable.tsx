'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Star, 
  Phone, 
  Globe, 
  MapPin, 
  Clock, 
  ExternalLink,
  ChevronUp,
  ChevronDown,
  Search
} from 'lucide-react';
import { BusinessData, FilterOptions } from '@/types';

interface BusinessTableProps {
  businesses: BusinessData[];
  onFilter: (filters: FilterOptions) => void;
}

type SortField = 'name' | 'rating' | 'reviewCount' | 'category';
type SortDirection = 'asc' | 'desc';

export default function BusinessTable({ businesses, onFilter }: BusinessTableProps) {
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  const handleSort = (field: SortField) => {
    const newDirection = field === sortField && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortDirection(newDirection);
    
    onFilter({
      sortBy: field,
      sortOrder: newDirection
    });
  };

  const filteredBusinesses = useMemo(() => {
    if (!searchQuery) return businesses;
    
    return businesses.filter(business =>
      business.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      business.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      business.category?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [businesses, searchQuery]);

  const paginatedBusinesses = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredBusinesses.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredBusinesses, currentPage]);

  const totalPages = Math.ceil(filteredBusinesses.length / itemsPerPage);

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center space-x-1 hover:text-primary-600 transition-colors"
    >
      <span>{children}</span>
      {sortField === field && (
        sortDirection === 'asc' ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )
      )}
    </button>
  );

  const RatingStars = ({ rating }: { rating?: number }) => {
    if (!rating) return <span className="text-secondary-400">No rating</span>;
    
    return (
      <div className="flex items-center space-x-1">
        <div className="flex">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`h-4 w-4 ${
                star <= rating
                  ? 'text-yellow-400 fill-current'
                  : 'text-secondary-300'
              }`}
            />
          ))}
        </div>
        <span className="text-sm font-medium text-secondary-700">
          {rating.toFixed(1)}
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with Search */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-secondary-900">
            Business Results ({filteredBusinesses.length})
          </h3>
          <p className="text-sm text-secondary-600">
            Showing {paginatedBusinesses.length} of {filteredBusinesses.length} businesses
          </p>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
          <input
            type="text"
            placeholder="Search businesses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10 w-64"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="table">
          <thead className="table-header">
            <tr>
              <th className="table-header-cell">
                <SortButton field="name">Business Name</SortButton>
              </th>
              <th className="table-header-cell">Address</th>
              <th className="table-header-cell">Contact</th>
              <th className="table-header-cell">
                <SortButton field="category">Category</SortButton>
              </th>
              <th className="table-header-cell">
                <SortButton field="rating">Rating</SortButton>
              </th>
              <th className="table-header-cell">
                <SortButton field="reviewCount">Reviews</SortButton>
              </th>
              <th className="table-header-cell">Hours</th>
            </tr>
          </thead>
          <tbody className="table-body">
            {paginatedBusinesses.map((business, index) => (
              <motion.tr
                key={business.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="table-row"
              >
                <td className="table-cell">
                  <div>
                    <div className="font-medium text-secondary-900 truncate max-w-48">
                      {business.name}
                    </div>
                    {business.website && (
                      <a
                        href={business.website.startsWith('http') ? business.website : `https://${business.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:text-primary-700 text-sm flex items-center mt-1"
                      >
                        <Globe className="h-3 w-3 mr-1" />
                        Website
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    )}
                  </div>
                </td>
                
                <td className="table-cell">
                  <div className="flex items-start">
                    <MapPin className="h-4 w-4 text-secondary-400 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-secondary-700 max-w-64 truncate">
                      {business.address}
                    </span>
                  </div>
                </td>
                
                <td className="table-cell">
                  <div className="space-y-1">
                    {business.phone && (
                      <div className="flex items-center">
                        <Phone className="h-3 w-3 text-secondary-400 mr-2" />
                        <a
                          href={`tel:${business.phone}`}
                          className="text-sm text-primary-600 hover:text-primary-700"
                        >
                          {business.phone}
                        </a>
                      </div>
                    )}
                    {!business.phone && (
                      <span className="text-sm text-secondary-400">No phone</span>
                    )}
                  </div>
                </td>
                
                <td className="table-cell">
                  {business.category && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                      {business.category}
                    </span>
                  )}
                </td>
                
                <td className="table-cell">
                  <RatingStars rating={business.rating} />
                </td>
                
                <td className="table-cell">
                  {business.reviewCount ? (
                    <span className="text-sm text-secondary-700">
                      {business.reviewCount.toLocaleString()}
                    </span>
                  ) : (
                    <span className="text-sm text-secondary-400">No reviews</span>
                  )}
                </td>
                
                <td className="table-cell">
                  {business.hours ? (
                    <div className="flex items-start">
                      <Clock className="h-4 w-4 text-secondary-400 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-secondary-700 max-w-32 truncate">
                        {business.hours}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-secondary-400">Hours unavailable</span>
                  )}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-secondary-700">
            Page {currentPage} of {totalPages}
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = i + Math.max(1, currentPage - 2);
              if (pageNum > totalPages) return null;
              
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-3 py-1 rounded text-sm ${
                    currentPage === pageNum
                      ? 'bg-primary-600 text-white'
                      : 'text-secondary-600 hover:bg-secondary-100'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 