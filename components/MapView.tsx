'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Map, { Marker, Popup, Source, Layer, NavigationControl, ScaleControl, FullscreenControl } from 'react-map-gl';
import { MapPin, Phone, Globe, Star, Clock, Navigation, Layers, Search, Filter, X, AlertCircle, Expand, Eye, BarChart3 } from 'lucide-react';
import { BusinessData } from '@/types';
import 'mapbox-gl/dist/mapbox-gl.css';

interface MapViewProps {
  businesses: BusinessData[];
  searchLocation?: { lat: number; lng: number };
  searchRadius?: number;
}

interface ViewState {
  longitude: number;
  latitude: number;
  zoom: number;
}

interface BusinessCluster {
  id: string;
  longitude: number;
  latitude: number;
  businesses: BusinessData[];
  count: number;
}

export default function MapView({ businesses, searchLocation, searchRadius = 5000 }: MapViewProps) {
  const [viewState, setViewState] = useState<ViewState>({
    longitude: searchLocation?.lng || -7.6167, // Default Casablanca
    latitude: searchLocation?.lat || 33.5833,
    zoom: 11
  });
  
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessData | null>(null);
  const [selectedCluster, setSelectedCluster] = useState<BusinessCluster | null>(null);
  const [mapStyle, setMapStyle] = useState('mapbox://styles/mapbox/streets-v12');
  const [showClustering, setShowClustering] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  
  const mapRef = useRef<any>(null);

  // Update map center when search location changes
  useEffect(() => {
    if (searchLocation) {
      console.log('🗺️ Updating map center to:', searchLocation);
      setIsLoading(true);
      setViewState(prev => ({
        ...prev,
        longitude: searchLocation.lng,
        latitude: searchLocation.lat,
        zoom: Math.max(prev.zoom, 12)
      }));
      setTimeout(() => setIsLoading(false), 1000);
    }
  }, [searchLocation]);

  // Enhanced coordinate processing for businesses
  const processedBusinesses = useMemo(() => {
    console.log('🏢 Processing businesses:', businesses.length);
    
    const processed = businesses.map((business, index) => {
      let coordinates = business.coordinates;
      
      // If no coordinates, try to generate approximate ones based on search location
      if (!coordinates && searchLocation) {
        // Generate random coordinates within search radius
        const radiusInDegrees = (searchRadius / 1000) / 111.32; // Convert meters to degrees
        const angle = Math.random() * 2 * Math.PI;
        const distance = Math.random() * radiusInDegrees;
        
        coordinates = {
          lat: searchLocation.lat + distance * Math.cos(angle),
          lng: searchLocation.lng + distance * Math.sin(angle)
        };
        
        console.log(`📍 Generated coordinates for ${business.name}:`, coordinates);
      }
      
      return {
        ...business,
        coordinates
      };
    });
    
    const withCoords = processed.filter(b => b.coordinates);
    console.log(`📊 Businesses with coordinates: ${withCoords.length}/${processed.length}`);
    
    setDebugInfo(`${withCoords.length}/${processed.length} businesses have coordinates`);
    
    return processed;
  }, [businesses, searchLocation, searchRadius]);

  // Filter businesses by category
  const filteredBusinesses = useMemo(() => {
    if (!categoryFilter) return processedBusinesses;
    return processedBusinesses.filter(business => 
      business.category?.toLowerCase().includes(categoryFilter.toLowerCase())
    );
  }, [processedBusinesses, categoryFilter]);

  // Get unique categories for filter
  const categories = useMemo(() => {
    const cats = new Set(processedBusinesses.map(b => b.category).filter(Boolean));
    return Array.from(cats);
  }, [processedBusinesses]);

  // Create clusters from businesses - only include businesses with coordinates
  const clusters = useMemo(() => {
    const businessesWithCoords = filteredBusinesses.filter(b => b.coordinates);
    
    if (!showClustering || businessesWithCoords.length < 5) {
      return businessesWithCoords.map(business => ({
        id: business.id,
        longitude: business.coordinates!.lng,
        latitude: business.coordinates!.lat,
        businesses: [business],
        count: 1
      }));
    }

    const clusters: BusinessCluster[] = [];
    const processed = new Set<string>();
    const clusterDistance = 0.008; // Reduced clustering distance for better separation

    businessesWithCoords.forEach(business => {
      if (processed.has(business.id)) return;

      const nearbyBusinesses = businessesWithCoords.filter(other => {
        if (processed.has(other.id) || business.id === other.id) return false;
        
        const distance = Math.sqrt(
          Math.pow(business.coordinates!.lat - other.coordinates!.lat, 2) +
          Math.pow(business.coordinates!.lng - other.coordinates!.lng, 2)
        );
        
        return distance < clusterDistance;
      });

      const clusterBusinesses = [business, ...nearbyBusinesses];
      clusterBusinesses.forEach(b => processed.add(b.id));

      // Calculate center point
      const avgLat = clusterBusinesses.reduce((sum, b) => sum + b.coordinates!.lat, 0) / clusterBusinesses.length;
      const avgLng = clusterBusinesses.reduce((sum, b) => sum + b.coordinates!.lng, 0) / clusterBusinesses.length;

      clusters.push({
        id: `cluster_${business.id}`,
        longitude: avgLng,
        latitude: avgLat,
        businesses: clusterBusinesses,
        count: clusterBusinesses.length
      });
    });

    console.log(`🎯 Created ${clusters.length} clusters from ${businessesWithCoords.length} businesses`);
    return clusters;
  }, [filteredBusinesses, showClustering]);

  // Search area circle data
  const searchAreaData = useMemo(() => {
    if (!searchLocation) return null;

    const points = 64;
    const coordinates = [];
    
    // Convert radius from meters to degrees (approximate)
    const radiusInDegrees = (searchRadius / 1000) / 111.32;
    
    for (let i = 0; i < points; i++) {
      const angle = (i * 360) / points * (Math.PI / 180);
      
      const lat = searchLocation.lat + radiusInDegrees * Math.cos(angle);
      const lng = searchLocation.lng + radiusInDegrees * Math.sin(angle);
      
      coordinates.push([lng, lat]);
    }
    
    coordinates.push(coordinates[0]); // Close the polygon

    return {
      type: 'Feature' as const,
      geometry: {
        type: 'Polygon' as const,
        coordinates: [coordinates]
      }
    };
  }, [searchLocation, searchRadius]);

  // Map style options
  const mapStyles = [
    { id: 'streets-v12', name: 'Streets', value: 'mapbox://styles/mapbox/streets-v12', icon: '🏙️' },
    { id: 'satellite-v9', name: 'Satellite', value: 'mapbox://styles/mapbox/satellite-v9', icon: '🛰️' },
    { id: 'light-v11', name: 'Light', value: 'mapbox://styles/mapbox/light-v11', icon: '☀️' },
    { id: 'dark-v11', name: 'Dark', value: 'mapbox://styles/mapbox/dark-v11', icon: '🌙' }
  ];

  // Get marker color based on category
  const getMarkerColor = (category?: string) => {
    const colors: { [key: string]: string } = {
      'restaurant': '#ef4444', // red
      'hotel': '#3b82f6',      // blue
      'cafe': '#f59e0b',       // amber
      'coffee': '#f59e0b',     // amber
      'shop': '#10b981',       // emerald
      'store': '#10b981',      // emerald
      'bank': '#6366f1',       // indigo
      'pharmacy': '#ec4899',   // pink
      'hospital': '#dc2626',   // red-600
      'school': '#7c3aed',     // violet
      'food': '#ef4444',       // red
      'shopping': '#10b981',   // emerald
    };
    
    const key = category?.toLowerCase() || '';
    for (const [type, color] of Object.entries(colors)) {
      if (key.includes(type)) return color;
    }
    return '#6b7280'; // gray-500 default
  };

  // Format phone number
  const formatPhone = (phone?: string) => {
    if (!phone) return null;
    return phone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
  };

  // Fit map to show all businesses
  const fitToBounds = () => {
    if (!mapRef.current || filteredBusinesses.length === 0) return;

    const businessesWithCoords = filteredBusinesses.filter(b => b.coordinates);
    if (businessesWithCoords.length === 0) return;

    const bounds = businessesWithCoords.reduce(
      (acc, business) => {
        const coords = business.coordinates!;
        return [
          Math.min(acc[0], coords.lng),
          Math.min(acc[1], coords.lat),
          Math.max(acc[2], coords.lng),
          Math.max(acc[3], coords.lat),
        ];
      },
      [Infinity, Infinity, -Infinity, -Infinity]
    );

    if (bounds[0] !== Infinity) {
      console.log('📏 Fitting map to bounds:', bounds);
      mapRef.current.fitBounds(bounds, { 
        padding: { top: 80, bottom: 80, left: 80, right: 80 }, 
        duration: 1500,
        essential: true
      });
    }
  };

  // Auto-fit when businesses change
  useEffect(() => {
    if (clusters.length > 0 && mapRef.current) {
      setTimeout(fitToBounds, 1500); // Delay to ensure map is ready
    }
  }, [clusters.length]);

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

  if (!mapboxToken) {
    return (
      <div className="h-96 lg:h-[600px] bg-gradient-to-br from-secondary-100 to-secondary-200 rounded-xl flex items-center justify-center">
        <div className="text-center p-8">
          <div className="bg-white rounded-full p-6 mx-auto mb-6 shadow-soft">
            <MapPin className="h-12 w-12 text-secondary-400 mx-auto" />
          </div>
          <h3 className="text-xl font-bold text-secondary-700 mb-3">Interactive Map Unavailable</h3>
          <p className="text-secondary-500 text-sm max-w-md">
            Please configure <code className="bg-secondary-200 px-2 py-1 rounded text-xs">NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN</code> to enable the professional interactive map experience.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-96 lg:h-[600px] bg-gradient-to-br from-secondary-100 to-secondary-200 rounded-xl overflow-hidden shadow-soft border border-secondary-200">
      {/* Enhanced Map Controls Panel */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="absolute top-4 left-4 z-20 flex flex-col space-y-3"
          >
            {/* Control Panel Header */}
            <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-secondary-900 flex items-center">
                  <Layers className="h-4 w-4 mr-2 text-primary-600" />
                  Map Controls
                </h3>
                <button
                  onClick={() => setShowControls(false)}
                  className="text-secondary-400 hover:text-secondary-600 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
              
              {/* Style Selector */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-secondary-700 block">Map Style</label>
                <div className="grid grid-cols-2 gap-2">
                  {mapStyles.map(style => (
                    <button
                      key={style.id}
                      onClick={() => setMapStyle(style.value)}
                      className={`p-2 rounded-lg text-xs font-medium transition-all ${
                        mapStyle === style.value
                          ? 'bg-primary-100 text-primary-800 border-2 border-primary-300'
                          : 'bg-secondary-50 text-secondary-700 border-2 border-transparent hover:bg-secondary-100'
                      }`}
                    >
                      <div className="flex items-center space-x-1">
                        <span>{style.icon}</span>
                        <span>{style.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Category Filter */}
              {categories.length > 0 && (
                <div className="space-y-2 mt-4">
                  <label className="text-xs font-medium text-secondary-700 block">Filter Category</label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full p-2 text-xs border border-secondary-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">🏢 All Categories</option>
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {getMarkerColor(category) === '#ef4444' ? '🍽️' : 
                         getMarkerColor(category) === '#3b82f6' ? '🏨' :
                         getMarkerColor(category) === '#f59e0b' ? '☕' :
                         getMarkerColor(category) === '#10b981' ? '🛍️' : '🏢'} {category}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Toggle Controls */}
              <div className="space-y-3 mt-4 pt-4 border-t border-secondary-200">
                <label className="flex items-center justify-between text-xs">
                  <span className="font-medium text-secondary-700">Smart Clustering</span>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={showClustering}
                      onChange={(e) => setShowClustering(e.target.checked)}
                      className="sr-only"
                    />
                    <div
                      onClick={() => setShowClustering(!showClustering)}
                      className={`w-10 h-5 rounded-full cursor-pointer transition-colors ${
                        showClustering ? 'bg-primary-600' : 'bg-secondary-300'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${
                          showClustering ? 'translate-x-5' : 'translate-x-0.5'
                        } mt-0.5`}
                      />
                    </div>
                  </div>
                </label>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={fitToBounds}
                    className="p-2 bg-primary-50 hover:bg-primary-100 text-primary-700 rounded-lg text-xs font-medium transition-colors flex items-center justify-center space-x-1"
                    title="Fit to all businesses"
                  >
                    <Expand className="h-3 w-3" />
                    <span>Fit All</span>
                  </button>
                  <button
                    onClick={() => setShowControls(false)}
                    className="p-2 bg-secondary-50 hover:bg-secondary-100 text-secondary-700 rounded-lg text-xs font-medium transition-colors flex items-center justify-center space-x-1"
                  >
                    <Eye className="h-3 w-3" />
                    <span>Hide</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Show Controls Button (when hidden) */}
      {!showControls && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={() => setShowControls(true)}
          className="absolute top-4 left-4 z-20 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-3 hover:bg-white transition-colors"
        >
          <Layers className="h-5 w-5 text-primary-600" />
        </motion.button>
      )}

      {/* Enhanced Statistics Panel */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-4 right-4 z-20 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-4 min-w-[180px]"
      >
        <div className="flex items-center space-x-2 mb-3">
          <BarChart3 className="h-4 w-4 text-primary-600" />
          <h3 className="text-sm font-semibold text-secondary-900">Statistics</h3>
        </div>
        
        <div className="space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-secondary-600">Businesses:</span>
            <span className="font-semibold text-secondary-900 bg-primary-50 px-2 py-1 rounded">
              {filteredBusinesses.length}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-secondary-600">Markers:</span>
            <span className="font-semibold text-secondary-900 bg-secondary-50 px-2 py-1 rounded">
              {clusters.length}
            </span>
          </div>
          {searchRadius && (
            <div className="flex justify-between items-center">
              <span className="text-secondary-600">Radius:</span>
              <span className="font-semibold text-secondary-900 bg-blue-50 px-2 py-1 rounded">
                {(searchRadius / 1000).toFixed(1)}km
              </span>
            </div>
          )}
          {debugInfo && (
            <div className="pt-2 mt-2 border-t border-secondary-200">
              <div className="text-xs text-secondary-500">
                📍 {debugInfo}
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Warning for businesses without coordinates */}
      <AnimatePresence>
        {processedBusinesses.length > 0 && processedBusinesses.filter(b => b.coordinates).length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30 bg-white rounded-xl shadow-xl border border-warning-200 p-6 max-w-sm"
          >
            <div className="flex items-start space-x-3">
              <div className="bg-warning-100 rounded-full p-2">
                <AlertCircle className="h-5 w-5 text-warning-600" />
              </div>
              <div>
                <h4 className="font-semibold text-warning-900 text-sm mb-2">No Location Data Available</h4>
                <p className="text-warning-700 text-xs leading-relaxed">
                  Business coordinates could not be extracted from Google Maps. This might happen with new businesses or recently moved locations.
                </p>
                <div className="mt-3 text-xs text-warning-600">
                  💡 Try searching in a different area or check if the businesses exist on Google Maps.
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading Overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-white/20 backdrop-blur-sm z-40 flex items-center justify-center"
          >
            <div className="bg-white rounded-xl shadow-lg p-4 flex items-center space-x-3">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary-600 border-t-transparent"></div>
              <span className="text-sm font-medium text-secondary-900">Updating map...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Map */}
      <Map
        ref={mapRef}
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        mapStyle={mapStyle}
        mapboxAccessToken={mapboxToken}
        style={{ width: '100%', height: '100%' }}
        maxZoom={18}
        minZoom={2}
        attributionControl={false}
      >
        {/* Search Area Circle */}
        {searchAreaData && (
          <Source id="search-area" type="geojson" data={searchAreaData}>
            <Layer
              id="search-area-fill"
              type="fill"
              paint={{
                'fill-color': '#3b82f6',
                'fill-opacity': 0.08
              }}
            />
            <Layer
              id="search-area-line"
              type="line"
              paint={{
                'line-color': '#3b82f6',
                'line-width': 2,
                'line-dasharray': [4, 4],
                'line-opacity': 0.6
              }}
            />
          </Source>
        )}

        {/* Business Markers */}
        {clusters.map((cluster) => (
          <Marker
            key={cluster.id}
            longitude={cluster.longitude}
            latitude={cluster.latitude}
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              if (cluster.count === 1) {
                setSelectedBusiness(cluster.businesses[0]);
                setSelectedCluster(null);
              } else {
                setSelectedCluster(cluster);
                setSelectedBusiness(null);
              }
            }}
          >
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.95 }}
              className="cursor-pointer"
            >
              {cluster.count === 1 ? (
                // Single business marker
                <div className="relative">
                  <div 
                    className="w-10 h-10 rounded-full border-3 border-white shadow-lg flex items-center justify-center relative transition-all hover:shadow-xl"
                    style={{ backgroundColor: getMarkerColor(cluster.businesses[0].category) }}
                  >
                    <MapPin className="h-5 w-5 text-white drop-shadow-sm" />
                    {cluster.businesses[0].rating && (
                      <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-sm border-2 border-white">
                        {cluster.businesses[0].rating.toFixed(0)}
                      </div>
                    )}
                  </div>
                  <div className="absolute inset-0 w-10 h-10 rounded-full animate-ping opacity-20" style={{ backgroundColor: getMarkerColor(cluster.businesses[0].category) }}></div>
                </div>
              ) : (
                // Cluster marker
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full border-3 border-white shadow-lg flex items-center justify-center transition-all hover:shadow-xl">
                    <span className="text-white font-bold text-sm drop-shadow-sm">{cluster.count}</span>
                  </div>
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-primary-300 to-primary-500 rounded-full border-2 border-white animate-pulse"></div>
                  <div className="absolute inset-0 w-12 h-12 bg-primary-500 rounded-full animate-ping opacity-20"></div>
                </div>
              )}
            </motion.div>
          </Marker>
        ))}

        {/* Search Location Marker */}
        {searchLocation && (
          <Marker longitude={searchLocation.lng} latitude={searchLocation.lat}>
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-red-400 to-red-600 rounded-full border-4 border-white shadow-xl flex items-center justify-center">
                <div className="w-4 h-4 bg-white rounded-full shadow-inner"></div>
              </div>
              <div className="absolute inset-0 w-10 h-10 bg-red-500 rounded-full animate-ping opacity-30"></div>
              <div className="absolute inset-0 w-10 h-10 bg-red-400 rounded-full animate-pulse opacity-40 animation-delay-500"></div>
            </motion.div>
          </Marker>
        )}

        {/* Enhanced Navigation Controls */}
        <NavigationControl position="bottom-right" style={{ marginRight: 16, marginBottom: 16 }} />
        <ScaleControl position="bottom-left" style={{ marginLeft: 16, marginBottom: 16 }} />
        <FullscreenControl position="bottom-right" style={{ marginRight: 16, marginBottom: 60 }} />

        {/* Enhanced Business Popup */}
        {selectedBusiness && selectedBusiness.coordinates && (
          <Popup
            longitude={selectedBusiness.coordinates.lng}
            latitude={selectedBusiness.coordinates.lat}
            onClose={() => setSelectedBusiness(null)}
            closeButton={false}
            closeOnClick={false}
            anchor="bottom"
            className="max-w-sm"
            offset={[0, -10]}
          >
            <div className="bg-white rounded-xl shadow-xl border border-secondary-200 overflow-hidden">
              <div className="p-5">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-secondary-900 text-base leading-snug pr-2">
                      {selectedBusiness.name}
                    </h3>
                    {selectedBusiness.rating && (
                      <div className="flex items-center mt-2">
                        <div className="flex items-center bg-yellow-50 px-2 py-1 rounded-full">
                          <Star className="h-3 w-3 text-yellow-500 mr-1" />
                          <span className="text-xs font-semibold text-yellow-700">
                            {selectedBusiness.rating.toFixed(1)}
                          </span>
                        </div>
                        {selectedBusiness.reviewCount && (
                          <span className="text-xs text-secondary-500 ml-2">
                            ({selectedBusiness.reviewCount} reviews)
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedBusiness(null)}
                    className="text-secondary-400 hover:text-secondary-600 transition-colors p-1 rounded-full hover:bg-secondary-50"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Content */}
                <div className="space-y-3 text-sm">
                  <div className="flex items-start">
                    <div className="bg-secondary-100 rounded-full p-1.5 mr-3 mt-0.5">
                      <MapPin className="h-3 w-3 text-secondary-600" />
                    </div>
                    <span className="text-secondary-700 leading-relaxed">{selectedBusiness.address}</span>
                  </div>

                  {selectedBusiness.phone && (
                    <div className="flex items-center">
                      <div className="bg-green-100 rounded-full p-1.5 mr-3">
                        <Phone className="h-3 w-3 text-green-600" />
                      </div>
                      <a 
                        href={`tel:${selectedBusiness.phone}`} 
                        className="text-primary-600 hover:text-primary-700 font-medium transition-colors"
                      >
                        {formatPhone(selectedBusiness.phone)}
                      </a>
                    </div>
                  )}

                  {selectedBusiness.website && (
                    <div className="flex items-center">
                      <div className="bg-blue-100 rounded-full p-1.5 mr-3">
                        <Globe className="h-3 w-3 text-blue-600" />
                      </div>
                      <a 
                        href={selectedBusiness.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:text-primary-700 font-medium transition-colors truncate"
                      >
                        Visit Website
                      </a>
                    </div>
                  )}

                  {selectedBusiness.hours && (
                    <div className="flex items-start">
                      <div className="bg-purple-100 rounded-full p-1.5 mr-3 mt-0.5">
                        <Clock className="h-3 w-3 text-purple-600" />
                      </div>
                      <span className="text-secondary-700 leading-relaxed">{selectedBusiness.hours}</span>
                    </div>
                  )}

                  {selectedBusiness.category && (
                    <div className="pt-3 border-t border-secondary-100">
                      <div className="flex items-center justify-center">
                        <span 
                          className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold text-white shadow-sm"
                          style={{ backgroundColor: getMarkerColor(selectedBusiness.category) }}
                        >
                          {selectedBusiness.category}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Popup>
        )}

        {/* Enhanced Cluster Popup */}
        {selectedCluster && (
          <Popup
            longitude={selectedCluster.longitude}
            latitude={selectedCluster.latitude}
            onClose={() => setSelectedCluster(null)}
            closeButton={false}
            closeOnClick={false}
            anchor="bottom"
            className="max-w-xs"
            offset={[0, -10]}
          >
            <div className="bg-white rounded-xl shadow-xl border border-secondary-200 overflow-hidden">
              <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-4 py-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white text-sm">
                    {selectedCluster.count} Businesses
                  </h3>
                  <button
                    onClick={() => setSelectedCluster(null)}
                    className="text-white/80 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </div>
              <div className="p-3">
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedCluster.businesses.map((business, index) => (
                    <motion.button
                      key={business.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => {
                        setSelectedBusiness(business);
                        setSelectedCluster(null);
                      }}
                      className="w-full text-left p-3 rounded-lg hover:bg-secondary-50 transition-colors border border-transparent hover:border-secondary-200"
                    >
                      <div className="font-medium text-sm text-secondary-900 truncate mb-1">
                        {business.name}
                      </div>
                      <div className="text-xs text-secondary-500 truncate mb-1">
                        {business.category}
                      </div>
                      {business.rating && (
                        <div className="flex items-center">
                          <Star className="h-3 w-3 text-yellow-400 mr-1" />
                          <span className="text-xs text-secondary-600 font-medium">
                            {business.rating.toFixed(1)}
                          </span>
                        </div>
                      )}
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
} 