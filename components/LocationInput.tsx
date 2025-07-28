'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Target, Loader2, Search, Navigation, Globe, Crosshair } from 'lucide-react';
import toast from 'react-hot-toast';

interface LocationSuggestion {
  id: string;
  place_name: string;
  center: [number, number];
  place_type: string[];
  context?: any[];
}

interface LocationInputProps {
  value: string;
  onChange: (location: string, coordinates?: { lat: number; lng: number }) => void;
  disabled?: boolean;
  error?: string;
}

export default function LocationInput({ value, onChange, disabled, error }: LocationInputProps) {
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [inputMode, setInputMode] = useState<'address' | 'coordinates'>('address');
  const [coordinates, setCoordinates] = useState({ lat: '', lng: '' });
  
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Handle input change with debounced suggestions
  const handleInputChange = (inputValue: string) => {
    onChange(inputValue);
    
    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Don't search for very short queries or coordinates
    if (inputValue.length < 3 || /^[-\d\s.,]+$/.test(inputValue)) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Debounce API calls
    debounceRef.current = setTimeout(async () => {
      await fetchSuggestions(inputValue);
    }, 300);
  };

  // Fetch location suggestions from Mapbox
  const fetchSuggestions = async (query: string) => {
    if (!query || query.length < 3) return;

    setIsLoadingSuggestions(true);
    try {
      const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
      if (!mapboxToken) {
        // Fallback to basic suggestions without API
        const basicSuggestions = generateBasicSuggestions(query);
        setSuggestions(basicSuggestions);
        setShowSuggestions(basicSuggestions.length > 0);
        return;
      }

      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxToken}&limit=8&types=country,region,postcode,district,place,locality,neighborhood,address`
      );

      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.features || []);
        setShowSuggestions(data.features?.length > 0);
      } else {
        // Fallback to basic suggestions
        const basicSuggestions = generateBasicSuggestions(query);
        setSuggestions(basicSuggestions);
        setShowSuggestions(basicSuggestions.length > 0);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      // Show basic suggestions as fallback
      const basicSuggestions = generateBasicSuggestions(query);
      setSuggestions(basicSuggestions);
      setShowSuggestions(basicSuggestions.length > 0);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  // Generate basic suggestions without API
  const generateBasicSuggestions = (query: string): LocationSuggestion[] => {
    const commonPlaces = [
      'New York, NY, USA', 'Los Angeles, CA, USA', 'London, UK', 'Paris, France',
      'Tokyo, Japan', 'Berlin, Germany', 'Sydney, Australia', 'Toronto, Canada',
      'Dubai, UAE', 'Singapore', 'Madrid, Spain', 'Rome, Italy', 'Amsterdam, Netherlands',
      'Casablanca, Morocco', 'Cairo, Egypt', 'Mumbai, India', 'Seoul, South Korea'
    ];

    return commonPlaces
      .filter(place => place.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 6)
      .map((place, index) => ({
        id: `basic_${index}`,
        place_name: place,
        center: [0, 0] as [number, number],
        place_type: ['place']
      }));
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: LocationSuggestion) => {
    onChange(suggestion.place_name, {
      lat: suggestion.center[1],
      lng: suggestion.center[0]
    });
    setShowSuggestions(false);
    inputRef.current?.blur();
  };

  // Get current location
  const getCurrentLocation = async () => {
    setIsGettingLocation(true);
    
    try {
      if (!navigator.geolocation) {
        toast.error('Geolocation is not supported by your browser');
        return;
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
        );
      });

      const { latitude, longitude } = position.coords;
      
      // Try reverse geocoding
      try {
        const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
        if (mapboxToken) {
          const response = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${mapboxToken}`
          );
          
          if (response.ok) {
            const data = await response.json();
            const place = data.features[0];
            if (place) {
              onChange(place.place_name, { lat: latitude, lng: longitude });
              toast.success(`📍 Location detected: ${place.place_name}`, { duration: 4000 });
              return;
            }
          }
        }
        
        // Fallback to coordinates
        const coordString = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
        onChange(coordString, { lat: latitude, lng: longitude });
        toast.success('📍 Location detected using coordinates', { duration: 4000 });
        
      } catch (geocodingError) {
        const coordString = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
        onChange(coordString, { lat: latitude, lng: longitude });
        toast.success('📍 Location detected using coordinates', { duration: 4000 });
      }
      
    } catch (error: any) {
      let errorMessage = 'Failed to get your location';
      if (error.code === 1) errorMessage = 'Location access denied. Please enable location services.';
      else if (error.code === 2) errorMessage = 'Location unavailable. Check your GPS/network.';
      else if (error.code === 3) errorMessage = 'Location request timed out. Please try again.';
      
      toast.error(errorMessage, { duration: 6000 });
    } finally {
      setIsGettingLocation(false);
    }
  };

  // Handle coordinates input
  const handleCoordinatesSubmit = () => {
    const lat = parseFloat(coordinates.lat);
    const lng = parseFloat(coordinates.lng);
    
    if (isNaN(lat) || isNaN(lng)) {
      toast.error('Please enter valid latitude and longitude values');
      return;
    }

    if (lat < -90 || lat > 90) {
      toast.error('Latitude must be between -90 and 90');
      return;
    }

    if (lng < -180 || lng > 180) {
      toast.error('Longitude must be between -180 and 180');
      return;
    }

    const coordString = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    onChange(coordString, { lat, lng });
    setInputMode('address');
    toast.success('📍 Coordinates set successfully');
  };

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node) &&
          inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getPlaceIcon = (placeType: string[]) => {
    if (placeType.includes('country')) return '🌍';
    if (placeType.includes('region')) return '🏞️';
    if (placeType.includes('place') || placeType.includes('locality')) return '🏙️';
    if (placeType.includes('address')) return '🏠';
    if (placeType.includes('poi')) return '📍';
    return '📍';
  };

  return (
    <div className="space-y-2">
      <label className="label flex items-center justify-between">
        <span className="flex items-center">
          <MapPin className="h-4 w-4 mr-2" />
          Location *
        </span>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setInputMode(inputMode === 'address' ? 'coordinates' : 'address')}
            className="text-xs text-primary-600 hover:text-primary-700 flex items-center"
            disabled={disabled}
          >
            <Crosshair className="h-3 w-3 mr-1" />
            {inputMode === 'address' ? 'Use Coordinates' : 'Use Address'}
          </button>
        </div>
      </label>

      {inputMode === 'address' ? (
        <div className="relative">
          <div className="flex space-x-2">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={(e) => handleInputChange(e.target.value)}
                onFocus={() => value.length >= 3 && setShowSuggestions(suggestions.length > 0)}
                className={`input pr-10 ${error ? 'border-error-300' : ''}`}
                placeholder="Enter city, address, or area (e.g., 'Paris, France')"
                disabled={disabled}
                autoComplete="off"
              />
              
              {isLoadingSuggestions && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Loader2 className="h-4 w-4 animate-spin text-secondary-500" />
                </div>
              )}
            </div>
            
            <button
              type="button"
              onClick={getCurrentLocation}
              disabled={isGettingLocation || disabled}
              className="btn-secondary flex-shrink-0 px-3"
              title="Use my current location"
            >
              {isGettingLocation ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Target className="h-4 w-4" />
              )}
            </button>
          </div>

          {/* Suggestions Dropdown */}
          <AnimatePresence>
            {showSuggestions && suggestions.length > 0 && (
              <motion.div
                ref={suggestionsRef}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute z-50 w-full mt-1 bg-white border border-secondary-200 rounded-lg shadow-lg max-h-64 overflow-y-auto"
              >
                {suggestions.map((suggestion, index) => (
                  <button
                    key={suggestion.id || index}
                    type="button"
                    onClick={() => handleSuggestionSelect(suggestion)}
                    className="w-full px-4 py-3 text-left hover:bg-secondary-50 flex items-start space-x-3 transition-colors"
                  >
                    <span className="text-lg mt-0.5">
                      {getPlaceIcon(suggestion.place_type)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-secondary-900 truncate">
                        {suggestion.place_name.split(',')[0]}
                      </div>
                      <div className="text-sm text-secondary-500 truncate">
                        {suggestion.place_name}
                      </div>
                    </div>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-secondary-700 mb-1 block">
                Latitude
              </label>
              <input
                type="number"
                step="0.000001"
                value={coordinates.lat}
                onChange={(e) => setCoordinates(prev => ({ ...prev, lat: e.target.value }))}
                className="input text-sm"
                placeholder="e.g., 40.7128"
                disabled={disabled}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-secondary-700 mb-1 block">
                Longitude
              </label>
              <input
                type="number"
                step="0.000001"
                value={coordinates.lng}
                onChange={(e) => setCoordinates(prev => ({ ...prev, lng: e.target.value }))}
                className="input text-sm"
                placeholder="e.g., -74.0060"
                disabled={disabled}
              />
            </div>
          </div>
          <button
            type="button"
            onClick={handleCoordinatesSubmit}
            disabled={!coordinates.lat || !coordinates.lng || disabled}
            className="btn-secondary w-full text-sm"
          >
            <Navigation className="h-3 w-3 mr-2" />
            Set Coordinates
          </button>
        </div>
      )}

      {error && (
        <p className="text-error-600 text-sm">{error}</p>
      )}

      {value && (
        <p className="text-sm text-primary-600 flex items-center">
          <MapPin className="h-3 w-3 mr-1" />
          Searching around: {value}
        </p>
      )}
    </div>
  );
} 