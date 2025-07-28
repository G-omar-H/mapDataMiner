'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, X, Search, Tag, Star, Zap } from 'lucide-react';

interface BusinessCategory {
  id: string;
  name: string;
  icon: string;
  popular?: boolean;
  searchTerms?: string[];
}

const BUSINESS_CATEGORIES: BusinessCategory[] = [
  // Popular categories
  { id: 'restaurant', name: 'Restaurants', icon: '🍽️', popular: true, searchTerms: ['food', 'dining', 'eat'] },
  { id: 'hotel', name: 'Hotels & Lodging', icon: '🏨', popular: true, searchTerms: ['accommodation', 'stay'] },
  { id: 'shop', name: 'Retail Stores', icon: '🛍️', popular: true, searchTerms: ['shopping', 'store'] },
  { id: 'cafe', name: 'Cafes & Coffee', icon: '☕', popular: true, searchTerms: ['coffee', 'cafe'] },
  { id: 'pharmacy', name: 'Pharmacies', icon: '💊', popular: true, searchTerms: ['medicine', 'drugs'] },
  { id: 'bank', name: 'Banks & ATMs', icon: '🏦', popular: true, searchTerms: ['finance', 'atm', 'money'] },
  
  // Food & Dining
  { id: 'fast-food', name: 'Fast Food', icon: '🍔', searchTerms: ['burger', 'quick', 'takeaway'] },
  { id: 'pizza', name: 'Pizza Places', icon: '🍕', searchTerms: ['pizzeria'] },
  { id: 'bakery', name: 'Bakeries', icon: '🥖', searchTerms: ['bread', 'pastry'] },
  { id: 'bar', name: 'Bars & Pubs', icon: '🍺', searchTerms: ['pub', 'drink', 'alcohol'] },
  { id: 'ice-cream', name: 'Ice Cream', icon: '🍦', searchTerms: ['gelato', 'frozen'] },
  
  // Health & Beauty
  { id: 'hospital', name: 'Hospitals', icon: '🏥', searchTerms: ['medical', 'emergency'] },
  { id: 'dentist', name: 'Dental Services', icon: '🦷', searchTerms: ['teeth', 'dental'] },
  { id: 'doctor', name: 'Doctors & Clinics', icon: '👨‍⚕️', searchTerms: ['medical', 'clinic', 'physician'] },
  { id: 'beauty-salon', name: 'Beauty Salons', icon: '💄', searchTerms: ['hair', 'spa', 'beauty'] },
  { id: 'gym', name: 'Gyms & Fitness', icon: '💪', searchTerms: ['fitness', 'workout', 'exercise'] },
  
  // Services
  { id: 'lawyer', name: 'Legal Services', icon: '⚖️', searchTerms: ['attorney', 'law'] },
  { id: 'real-estate', name: 'Real Estate', icon: '🏠', searchTerms: ['property', 'realtor'] },
  { id: 'automotive', name: 'Auto Services', icon: '🚗', searchTerms: ['car', 'repair', 'garage'] },
  { id: 'gas-station', name: 'Gas Stations', icon: '⛽', searchTerms: ['fuel', 'petrol'] },
  { id: 'laundry', name: 'Laundry Services', icon: '👕', searchTerms: ['dry cleaning', 'wash'] },
  
  // Education & Community
  { id: 'school', name: 'Schools', icon: '🏫', searchTerms: ['education', 'university', 'college'] },
  { id: 'library', name: 'Libraries', icon: '📚', searchTerms: ['books', 'study'] },
  { id: 'church', name: 'Places of Worship', icon: '⛪', searchTerms: ['mosque', 'temple', 'synagogue'] },
  { id: 'government', name: 'Government Offices', icon: '🏛️', searchTerms: ['city hall', 'municipal'] },
  
  // Entertainment & Recreation
  { id: 'movie-theater', name: 'Movie Theaters', icon: '🎬', searchTerms: ['cinema', 'film'] },
  { id: 'park', name: 'Parks & Recreation', icon: '🌳', searchTerms: ['playground', 'outdoor'] },
  { id: 'museum', name: 'Museums', icon: '🏛️', searchTerms: ['art', 'history'] },
  { id: 'amusement-park', name: 'Amusement Parks', icon: '🎢', searchTerms: ['theme park', 'rides'] },
  
  // Transportation
  { id: 'airport', name: 'Airports', icon: '✈️', searchTerms: ['flight', 'terminal'] },
  { id: 'train-station', name: 'Train Stations', icon: '🚂', searchTerms: ['railway', 'metro'] },
  { id: 'taxi', name: 'Taxi Services', icon: '🚕', searchTerms: ['cab', 'uber'] },
  { id: 'parking', name: 'Parking', icon: '🅿️', searchTerms: ['garage', 'lot'] },
  
  // Specialty Stores
  { id: 'electronics', name: 'Electronics', icon: '📱', searchTerms: ['phone', 'computer', 'tech'] },
  { id: 'clothing', name: 'Clothing Stores', icon: '👗', searchTerms: ['fashion', 'apparel'] },
  { id: 'jewelry', name: 'Jewelry Stores', icon: '💎', searchTerms: ['watches', 'rings'] },
  { id: 'bookstore', name: 'Bookstores', icon: '📖', searchTerms: ['books', 'reading'] },
  { id: 'pet-store', name: 'Pet Stores', icon: '🐕', searchTerms: ['animals', 'pet supplies'] },
  { id: 'florist', name: 'Florists', icon: '🌸', searchTerms: ['flowers', 'plants'] },
];

interface CategorySelectorProps {
  selectedCategories: string[];
  onChange: (categories: string[]) => void;
  disabled?: boolean;
  maxSelections?: number;
}

export default function CategorySelector({ 
  selectedCategories, 
  onChange, 
  disabled,
  maxSelections = 10 
}: CategorySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showPopularOnly, setShowPopularOnly] = useState(true);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Filter categories based on search
  const filteredCategories = BUSINESS_CATEGORIES.filter(category => {
    const matchesSearch = searchQuery === '' || 
      category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.searchTerms?.some(term => 
        term.toLowerCase().includes(searchQuery.toLowerCase())
      );
    
    return matchesSearch && (showPopularOnly ? category.popular : true);
  });

  const popularCategories = BUSINESS_CATEGORIES.filter(cat => cat.popular);
  
  // Handle category toggle
  const toggleCategory = (categoryId: string) => {
    if (selectedCategories.includes(categoryId)) {
      onChange(selectedCategories.filter(id => id !== categoryId));
    } else if (selectedCategories.length < maxSelections) {
      onChange([...selectedCategories, categoryId]);
    }
  };

  // Clear all categories
  const clearAll = () => {
    onChange([]);
  };

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
        setShowPopularOnly(true);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getCategoryById = (id: string) => BUSINESS_CATEGORIES.find(cat => cat.id === id);

  return (
    <div className="space-y-2">
      <label className="label flex items-center justify-between">
        <span className="flex items-center">
          <Tag className="h-4 w-4 mr-2" />
          Business Categories
        </span>
        <span className="text-xs text-secondary-500">
          ({selectedCategories.length}/{maxSelections} selected)
        </span>
      </label>

      <div className="relative" ref={dropdownRef}>
        {/* Main selector button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled}
          className={`w-full input flex items-center justify-between ${
            selectedCategories.length > 0 ? 'text-secondary-900' : 'text-secondary-500'
          }`}
        >
          <div className="flex items-center space-x-2 flex-1 min-w-0">
            {selectedCategories.length === 0 ? (
              <span>Select business categories (optional - leave empty for all)</span>
            ) : selectedCategories.length === 1 ? (
              <div className="flex items-center space-x-2">
                <span>{getCategoryById(selectedCategories[0])?.icon}</span>
                <span className="truncate">{getCategoryById(selectedCategories[0])?.name}</span>
              </div>
            ) : (
              <span className="truncate">
                {selectedCategories.length} categories selected
              </span>
            )}
          </div>
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Selected categories pills */}
        {selectedCategories.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {selectedCategories.map(categoryId => {
              const category = getCategoryById(categoryId);
              return category ? (
                <motion.div
                  key={categoryId}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="inline-flex items-center space-x-1 bg-primary-100 text-primary-800 px-2 py-1 rounded-full text-xs"
                >
                  <span>{category.icon}</span>
                  <span>{category.name}</span>
                  <button
                    type="button"
                    onClick={() => toggleCategory(categoryId)}
                    className="hover:bg-primary-200 rounded-full p-0.5"
                    disabled={disabled}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </motion.div>
              ) : null;
            })}
            {selectedCategories.length > 1 && (
              <button
                type="button"
                onClick={clearAll}
                className="text-xs text-secondary-500 hover:text-secondary-700 px-2 py-1"
                disabled={disabled}
              >
                Clear all
              </button>
            )}
          </div>
        )}

        {/* Dropdown */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute z-50 w-full mt-1 bg-white border border-secondary-200 rounded-lg shadow-lg"
            >
              {/* Search and filters */}
              <div className="p-3 border-b border-secondary-100">
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search categories..."
                    className="w-full pl-10 pr-4 py-2 border border-secondary-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    autoComplete="off"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => setShowPopularOnly(true)}
                      className={`px-3 py-1 rounded-full text-xs transition-colors ${
                        showPopularOnly 
                          ? 'bg-primary-100 text-primary-800' 
                          : 'text-secondary-600 hover:bg-secondary-100'
                      }`}
                    >
                      <Star className="h-3 w-3 mr-1 inline" />
                      Popular
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPopularOnly(false)}
                      className={`px-3 py-1 rounded-full text-xs transition-colors ${
                        !showPopularOnly 
                          ? 'bg-primary-100 text-primary-800' 
                          : 'text-secondary-600 hover:bg-secondary-100'
                      }`}
                    >
                      All Categories
                    </button>
                  </div>
                  
                  {selectedCategories.length === maxSelections && (
                    <span className="text-xs text-warning-600">
                      Maximum {maxSelections} categories
                    </span>
                  )}
                </div>
              </div>

              {/* Categories list */}
              <div className="max-h-64 overflow-y-auto">
                {filteredCategories.length === 0 ? (
                  <div className="p-4 text-center text-secondary-500 text-sm">
                    No categories found matching "{searchQuery}"
                  </div>
                ) : (
                  <div className="p-2">
                    {filteredCategories.map((category) => {
                      const isSelected = selectedCategories.includes(category.id);
                      const isDisabled = !isSelected && selectedCategories.length >= maxSelections;
                      
                      return (
                        <button
                          key={category.id}
                          type="button"
                          onClick={() => !isDisabled && toggleCategory(category.id)}
                          disabled={isDisabled}
                          className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-left transition-colors ${
                            isSelected
                              ? 'bg-primary-50 text-primary-900 border border-primary-200'
                              : isDisabled
                              ? 'text-secondary-400 cursor-not-allowed'
                              : 'hover:bg-secondary-50 text-secondary-700'
                          }`}
                        >
                          <span className="text-lg">{category.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium truncate">{category.name}</span>
                              {category.popular && (
                                <Zap className="h-3 w-3 text-warning-500 flex-shrink-0" />
                              )}
                            </div>
                            {category.searchTerms && (
                              <div className="text-xs text-secondary-500 truncate">
                                {category.searchTerms.slice(0, 3).join(', ')}
                              </div>
                            )}
                          </div>
                          {isSelected && (
                            <div className="h-4 w-4 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
                              <div className="h-2 w-2 bg-white rounded-full" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-3 border-t border-secondary-100 bg-secondary-50 rounded-b-lg">
                <div className="flex items-center justify-between text-xs text-secondary-600">
                  <span>
                    {selectedCategories.length === 0 
                      ? 'No categories = search all business types'
                      : `Searching ${selectedCategories.length} categories`
                    }
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="text-primary-600 hover:text-primary-700"
                  >
                    Done
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
} 