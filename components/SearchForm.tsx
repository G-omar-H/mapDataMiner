'use client';

import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Settings, Loader2, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { SearchParams } from '@/types';
import { searchParamsSchema } from '@/utils/validation';
import LocationInput from './LocationInput';
import CategorySelector from './CategorySelector';
import SearchLimits from './SearchLimits';
import toast from 'react-hot-toast';

interface SearchFormProps {
  onSearch: (params: SearchParams) => void;
  isLoading?: boolean;
}

export default function SearchForm({ onSearch, isLoading }: SearchFormProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showLimits, setShowLimits] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<SearchParams>({
    resolver: zodResolver(searchParamsSchema),
    defaultValues: {
      location: '',
      categories: [],
      radius: 5000,
      maxResults: 100,
      searchMode: 'full'
    }
  });

  const watchedValues = watch();
  const hasAdvancedSettings = watchedValues.radius !== 5000 || watchedValues.categories.length > 0;
  const hasCustomLimits = watchedValues.maxResults !== 100 || watchedValues.searchMode !== 'full';

  const onSubmit = (data: SearchParams) => {
    // Validate that we have a location
    if (!data.location.trim()) {
      toast.error('Please enter a location or use geolocation');
      return;
    }

    // Show confirmation for large searches
    if (data.maxResults > 200) {
      const confirmed = window.confirm(
        `You're about to search for ${data.maxResults} businesses. This may take ${Math.ceil(data.maxResults * 3 / 60)} minutes and could trigger rate limiting. Continue?`
      );
      if (!confirmed) return;
    }

    onSearch(data);
  };

  return (
    <div className="bg-white rounded-xl shadow-soft border border-secondary-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4">
        <div className="flex items-center space-x-3">
          <div className="bg-white/20 p-2 rounded-lg">
            <Search className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">
              Advanced Business Search
            </h2>
            <p className="text-primary-100 text-sm">
              Professional-grade location intelligence with AI-powered categorization
            </p>
          </div>
          <div className="ml-auto">
            <Sparkles className="h-6 w-6 text-white/80" />
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
        {/* Location Input */}
        <Controller
          name="location"
          control={control}
          render={({ field }) => (
            <LocationInput
              value={field.value}
              onChange={(location, coordinates) => {
                field.onChange(location);
                if (coordinates) {
                  setValue('coordinates', coordinates);
                }
              }}
              disabled={isLoading}
              error={errors.location?.message}
            />
          )}
        />

        {/* Categories */}
        <Controller
          name="categories"
          control={control}
          render={({ field }) => (
            <CategorySelector
              selectedCategories={field.value}
              onChange={field.onChange}
              disabled={isLoading}
              maxSelections={10}
            />
          )}
        />

        {/* Advanced Options Toggle */}
        <div className="flex items-center justify-between py-2">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center space-x-2 text-primary-600 hover:text-primary-700 font-medium"
            disabled={isLoading}
          >
            <Settings className="h-4 w-4" />
            <span>Advanced Settings</span>
            {hasAdvancedSettings && (
              <span className="bg-primary-100 text-primary-800 px-2 py-0.5 rounded-full text-xs">
                Active
              </span>
            )}
            {showAdvanced ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setShowLimits(!showLimits)}
            className="flex items-center space-x-2 text-secondary-600 hover:text-secondary-700 font-medium"
            disabled={isLoading}
          >
            <span>Search Limits</span>
            {hasCustomLimits && (
              <span className="bg-secondary-100 text-secondary-800 px-2 py-0.5 rounded-full text-xs">
                Custom
              </span>
            )}
            {showLimits ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Advanced Options */}
        <AnimatePresence>
          {showAdvanced && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4 p-4 bg-secondary-50 rounded-lg border border-secondary-200"
            >
              <h3 className="font-medium text-secondary-900 flex items-center">
                <Settings className="h-4 w-4 mr-2" />
                Advanced Search Parameters
              </h3>

              {/* Search Radius */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="label">
                    Search Radius
                  </label>
                  <span className="text-sm text-secondary-600">
                    {(watchedValues.radius / 1000).toFixed(1)} km
                  </span>
                </div>
                <Controller
                  name="radius"
                  control={control}
                  render={({ field }) => (
                    <div className="space-y-2">
                      <input
                        type="range"
                        min="500"
                        max="50000"
                        step="500"
                        value={field.value}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                        className="w-full h-2 bg-secondary-200 rounded-lg appearance-none cursor-pointer"
                        disabled={isLoading}
                      />
                      <div className="flex justify-between text-xs text-secondary-500">
                        <span>0.5 km</span>
                        <span>25 km</span>
                        <span>50 km</span>
                      </div>
                    </div>
                  )}
                />
                {errors.radius && (
                  <p className="text-error-600 text-sm">{errors.radius.message}</p>
                )}
              </div>

              {/* Search Quality */}
              <div className="space-y-2">
                <label className="label">Search Quality</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div className="flex items-center space-x-2 p-3 border border-secondary-200 rounded-lg">
                    <input
                      type="radio"
                      id="quality-fast"
                      className="text-primary-600"
                      checked={watchedValues.radius <= 2000}
                      onChange={() => setValue('radius', 1500)}
                      disabled={isLoading}
                    />
                    <label htmlFor="quality-fast" className="text-sm flex-1 cursor-pointer">
                      <div className="font-medium">Fast</div>
                      <div className="text-xs text-secondary-500">Small area, quick results</div>
                    </label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border border-secondary-200 rounded-lg">
                    <input
                      type="radio"
                      id="quality-balanced"
                      className="text-primary-600"
                      checked={watchedValues.radius > 2000 && watchedValues.radius <= 10000}
                      onChange={() => setValue('radius', 5000)}
                      disabled={isLoading}
                    />
                    <label htmlFor="quality-balanced" className="text-sm flex-1 cursor-pointer">
                      <div className="font-medium">Balanced</div>
                      <div className="text-xs text-secondary-500">Good coverage vs speed</div>
                    </label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border border-secondary-200 rounded-lg">
                    <input
                      type="radio"
                      id="quality-comprehensive"
                      className="text-primary-600"
                      checked={watchedValues.radius > 10000}
                      onChange={() => setValue('radius', 20000)}
                      disabled={isLoading}
                    />
                    <label htmlFor="quality-comprehensive" className="text-sm flex-1 cursor-pointer">
                      <div className="font-medium">Comprehensive</div>
                      <div className="text-xs text-secondary-500">Maximum coverage</div>
                    </label>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search Limits */}
        <AnimatePresence>
          {showLimits && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Controller
                name="maxResults"
                control={control}
                render={({ field: maxResultsField }) => (
                  <Controller
                    name="searchMode"
                    control={control}
                    render={({ field: searchModeField }) => (
                      <SearchLimits
                        maxResults={maxResultsField.value}
                        onMaxResultsChange={maxResultsField.onChange}
                        searchMode={searchModeField.value}
                        onSearchModeChange={searchModeField.onChange}
                        disabled={isLoading}
                      />
                    )}
                  />
                )}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit Button */}
        <div className="pt-4 border-t border-secondary-200">
          <motion.button
            type="submit"
            disabled={isLoading || !watchedValues.location}
            className="btn-primary w-full py-4 text-lg font-semibold relative overflow-hidden"
            whileHover={{ scale: isLoading ? 1 : 1.02 }}
            whileTap={{ scale: isLoading ? 1 : 0.98 }}
          >
            <div className="flex items-center justify-center space-x-3">
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Mining Business Data...</span>
                </>
              ) : (
                <>
                  <Search className="h-5 w-5" />
                  <span>Start Professional Search</span>
                  <Sparkles className="h-4 w-4" />
                </>
              )}
            </div>
            
            {/* Loading Progress Bar */}
            {isLoading && (
              <motion.div
                className="absolute bottom-0 left-0 h-1 bg-primary-300"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}
          </motion.button>
        </div>

        {/* Search Summary */}
        {watchedValues.location && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-primary-50 to-primary-100 p-4 rounded-lg border border-primary-200"
          >
            <div className="flex items-start space-x-3">
              <div className="text-primary-600 mt-0.5">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-primary-900 mb-2">
                  Ready to Search
                </h4>
                <div className="text-sm text-primary-800 space-y-1">
                  <div>📍 <strong>Location:</strong> {watchedValues.location}</div>
                  <div>🏷️ <strong>Categories:</strong> {watchedValues.categories.length === 0 ? 'All business types' : `${watchedValues.categories.length} selected`}</div>
                  <div>📏 <strong>Radius:</strong> {(watchedValues.radius / 1000).toFixed(1)} km</div>
                  <div>🎯 <strong>Max Results:</strong> {watchedValues.maxResults} businesses ({watchedValues.searchMode} mode)</div>
                  <div>⏱️ <strong>Est. Time:</strong> {Math.ceil(watchedValues.maxResults * 3 / 60)} minutes</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Pro Tips */}
        <div className="bg-secondary-50 border border-secondary-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="text-secondary-600 mt-0.5">💡</div>
            <div className="text-sm text-secondary-700">
              <p className="font-medium mb-2">Pro Tips for Better Results:</p>
              <ul className="space-y-1 text-xs">
                <li>• Use specific location names for better accuracy (e.g., "Downtown Paris" vs "Paris")</li>
                <li>• Start with Preview mode to test your search parameters</li>
                <li>• Multiple categories help find diverse businesses in the same area</li>
                <li>• Larger radius = more results but longer search time</li>
                <li>• Enable geolocation for the most accurate location-based searches</li>
              </ul>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
} 