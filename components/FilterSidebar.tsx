'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Filter, Star, Phone, Globe, RefreshCw } from 'lucide-react';
import { BusinessData, FilterOptions } from '@/types';

interface FilterSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onFilter: (filters: FilterOptions) => void;
  businesses: BusinessData[];
}

export default function FilterSidebar({ isOpen, onClose, onFilter, businesses }: FilterSidebarProps) {
  const [filters, setFilters] = useState<FilterOptions>({
    sortBy: 'name',
    sortOrder: 'asc'
  });

  const categories = Array.from(new Set(businesses.map(b => b.category).filter(Boolean)));
  
  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilter(newFilters);
  };

  const clearFilters = () => {
    const defaultFilters: FilterOptions = {
      sortBy: 'name',
      sortOrder: 'asc'
    };
    setFilters(defaultFilters);
    onFilter(defaultFilters);
  };

  const getFilteredCount = () => {
    let count = businesses.length;
    if (filters.category) {
      count = businesses.filter(b => b.category?.toLowerCase().includes(filters.category!.toLowerCase())).length;
    }
    if (filters.minRating) {
      count = businesses.filter(b => b.rating && b.rating >= filters.minRating!).length;
    }
    return count;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex">
        <motion.div
          initial={{ x: 300 }}
          animate={{ x: 0 }}
          exit={{ x: 300 }}
          className="bg-white w-80 h-full shadow-xl overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-secondary-200 p-6 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Filter className="h-5 w-5 text-primary-600" />
                <h2 className="text-lg font-semibold text-secondary-900">Filters</h2>
              </div>
              <button
                onClick={onClose}
                className="text-secondary-400 hover:text-secondary-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-secondary-600 mt-2">
              Showing {getFilteredCount()} of {businesses.length} businesses
            </p>
          </div>

          <div className="p-6 space-y-8">
            {/* Category Filter */}
            <div className="space-y-3">
              <label className="label">Category</label>
              <select
                value={filters.category || ''}
                onChange={(e) => handleFilterChange('category', e.target.value || undefined)}
                className="input"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Rating Filter */}
            <div className="space-y-3">
              <label className="label">Minimum Rating</label>
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <label key={rating} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="rating"
                      checked={filters.minRating === rating}
                      onChange={() => handleFilterChange('minRating', rating)}
                      className="text-primary-600 focus:ring-primary-500"
                    />
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
                      <span className="text-sm text-secondary-700">& up</span>
                    </div>
                  </label>
                ))}
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="rating"
                    checked={!filters.minRating}
                    onChange={() => handleFilterChange('minRating', undefined)}
                    className="text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-secondary-700">Any rating</span>
                </label>
              </div>
            </div>

            {/* Contact Info Filter */}
            <div className="space-y-3">
              <label className="label">Contact Information</label>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={filters.hasWebsite || false}
                    onChange={(e) => handleFilterChange('hasWebsite', e.target.checked || undefined)}
                    className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                  />
                  <Globe className="h-4 w-4 text-secondary-400" />
                  <span className="text-sm text-secondary-700">Has website</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={filters.hasPhone || false}
                    onChange={(e) => handleFilterChange('hasPhone', e.target.checked || undefined)}
                    className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                  />
                  <Phone className="h-4 w-4 text-secondary-400" />
                  <span className="text-sm text-secondary-700">Has phone number</span>
                </label>
              </div>
            </div>

            {/* Sort Options */}
            <div className="space-y-3">
              <label className="label">Sort By</label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value as FilterOptions['sortBy'])}
                className="input"
              >
                <option value="name">Business Name</option>
                <option value="rating">Rating</option>
                <option value="reviewCount">Review Count</option>
              </select>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => handleFilterChange('sortOrder', 'asc')}
                  className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors ${
                    filters.sortOrder === 'asc'
                      ? 'bg-primary-100 border-primary-300 text-primary-700'
                      : 'bg-white border-secondary-300 text-secondary-700 hover:bg-secondary-50'
                  }`}
                >
                  A → Z / Low → High
                </button>
                <button
                  onClick={() => handleFilterChange('sortOrder', 'desc')}
                  className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors ${
                    filters.sortOrder === 'desc'
                      ? 'bg-primary-100 border-primary-300 text-primary-700'
                      : 'bg-white border-secondary-300 text-secondary-700 hover:bg-secondary-50'
                  }`}
                >
                  Z → A / High → Low
                </button>
              </div>
            </div>

            {/* Clear Filters */}
            <div className="pt-4 border-t border-secondary-200">
              <button
                onClick={clearFilters}
                className="w-full btn-secondary"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Clear All Filters
              </button>
            </div>
          </div>

          {/* Summary */}
          <div className="sticky bottom-0 bg-secondary-50 border-t border-secondary-200 p-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">
                {getFilteredCount()}
              </div>
              <div className="text-sm text-secondary-600">
                businesses match your filters
              </div>
            </div>
          </div>
        </motion.div>
        
        {/* Backdrop */}
        <div className="flex-1" onClick={onClose} />
      </div>
    </AnimatePresence>
  );
} 