'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Zap, Clock, Target, Info, TrendingUp, AlertCircle } from 'lucide-react';

interface SearchLimitsProps {
  maxResults: number;
  onMaxResultsChange: (max: number) => void;
  searchMode: 'preview' | 'full' | 'unlimited';
  onSearchModeChange: (mode: 'preview' | 'full' | 'unlimited') => void;
  disabled?: boolean;
}

const SEARCH_MODES = {
  preview: {
    maxResults: 25,
    estimatedCost: 0,
    description: 'Quick preview with basic information',
    time: '30 seconds',
    icon: '👁️',
    color: 'bg-green-100 text-green-800 border-green-200'
  },
  full: {
    maxResults: 100,
    estimatedCost: 0.15,
    description: 'Complete business data with all details',
    time: '2-5 minutes',
    icon: '🎯',
    color: 'bg-blue-100 text-blue-800 border-blue-200'
  },
  unlimited: {
    maxResults: 500,
    estimatedCost: 0.75,
    description: 'Maximum coverage - all businesses found',
    time: '5-15 minutes',
    icon: '🚀',
    color: 'bg-purple-100 text-purple-800 border-purple-200'
  }
};

export default function SearchLimits({
  maxResults,
  onMaxResultsChange,
  searchMode,
  onSearchModeChange,
  disabled
}: SearchLimitsProps) {
  const [customMode, setCustomMode] = useState(false);
  const [estimatedTime, setEstimatedTime] = useState('');
  const [estimatedCost, setEstimatedCost] = useState(0);

  // Calculate estimates based on max results
  useEffect(() => {
    const calculateEstimates = () => {
      // Time estimation: ~3 seconds per business on average
      const timeInSeconds = Math.max(30, maxResults * 3);
      const minutes = Math.floor(timeInSeconds / 60);
      const seconds = timeInSeconds % 60;
      
      if (minutes > 0) {
        setEstimatedTime(`${minutes}m ${seconds > 0 ? `${seconds}s` : ''}`);
      } else {
        setEstimatedTime(`${seconds}s`);
      }

      // Cost estimation: $0.003 per business scraped (rough estimate)
      const costPerBusiness = 0.003;
      setEstimatedCost(maxResults * costPerBusiness);
    };

    calculateEstimates();
  }, [maxResults]);

  const handleModeChange = (mode: 'preview' | 'full' | 'unlimited') => {
    setCustomMode(false);
    onSearchModeChange(mode);
    onMaxResultsChange(SEARCH_MODES[mode].maxResults);
  };

  const handleCustomResults = (value: number) => {
    setCustomMode(true);
    onMaxResultsChange(value);
  };

  const getRecommendation = () => {
    if (maxResults <= 25) return 'Perfect for quick exploration and testing';
    if (maxResults <= 100) return 'Ideal balance of coverage and speed';
    if (maxResults <= 250) return 'Comprehensive coverage for detailed analysis';
    return 'Maximum coverage - use for complete area mapping';
  };

  const getRiskLevel = () => {
    if (maxResults <= 50) return { level: 'Low', color: 'text-green-600', icon: '✅' };
    if (maxResults <= 150) return { level: 'Medium', color: 'text-yellow-600', icon: '⚠️' };
    return { level: 'High', color: 'text-red-600', icon: '🚨' };
  };

  const risk = getRiskLevel();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="label">
          <Target className="h-4 w-4 mr-2" />
          Search Limits & API Optimization
        </label>
        <div className="flex items-center space-x-2 text-xs">
          <span className={risk.color}>{risk.icon} {risk.level} Risk</span>
        </div>
      </div>

      {/* Preset Modes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {Object.entries(SEARCH_MODES).map(([mode, config]) => (
          <motion.button
            key={mode}
            type="button"
            onClick={() => handleModeChange(mode as any)}
            disabled={disabled}
            className={`p-4 rounded-lg border-2 transition-all text-left ${
              searchMode === mode && !customMode
                ? config.color
                : 'border-secondary-200 hover:border-secondary-300 bg-white'
            }`}
            whileHover={{ scale: disabled ? 1 : 1.02 }}
            whileTap={{ scale: disabled ? 1 : 0.98 }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="text-lg">{config.icon}</span>
                <span className="font-semibold capitalize">{mode}</span>
              </div>
              <span className="text-xs bg-secondary-100 px-2 py-1 rounded">
                {config.maxResults} max
              </span>
            </div>
            <p className="text-xs text-secondary-600 mb-2">
              {config.description}
            </p>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                {config.time}
              </span>
              <span className="flex items-center">
                <DollarSign className="h-3 w-3 mr-1" />
                ${config.estimatedCost.toFixed(2)}
              </span>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Custom Limits */}
      <div className="bg-secondary-50 rounded-lg p-4 border border-secondary-200">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-secondary-900">Custom Limits</h4>
          <div className="flex items-center space-x-2 text-xs text-secondary-600">
            <Info className="h-3 w-3" />
            <span>Fine-tune for your needs</span>
          </div>
        </div>

        <div className="space-y-4">
          {/* Max Results Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-secondary-700">
                Maximum Results
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min="10"
                  max="500"
                  step="10"
                  value={maxResults}
                  onChange={(e) => handleCustomResults(parseInt(e.target.value) || 10)}
                  className="w-20 px-2 py-1 border border-secondary-300 rounded text-sm"
                  disabled={disabled}
                />
                <span className="text-xs text-secondary-500">businesses</span>
              </div>
            </div>
            
            <input
              type="range"
              min="10"
              max="500"
              step="10"
              value={maxResults}
              onChange={(e) => handleCustomResults(parseInt(e.target.value))}
              className="w-full h-2 bg-secondary-200 rounded-lg appearance-none cursor-pointer"
              disabled={disabled}
            />
            
            <div className="flex justify-between text-xs text-secondary-500">
              <span>10 (Quick)</span>
              <span>100 (Balanced)</span>
              <span>500 (Maximum)</span>
            </div>
          </div>

          {/* Estimates Display */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3 border-t border-secondary-200">
            <div className="text-center">
              <div className="text-lg font-semibold text-secondary-900">{maxResults}</div>
              <div className="text-xs text-secondary-500">Max Results</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-secondary-900">{estimatedTime}</div>
              <div className="text-xs text-secondary-500">Est. Time</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-secondary-900">${estimatedCost.toFixed(3)}</div>
              <div className="text-xs text-secondary-500">Est. Cost</div>
            </div>
            <div className="text-center">
              <div className={`text-lg font-semibold ${risk.color}`}>{risk.level}</div>
              <div className="text-xs text-secondary-500">Block Risk</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-primary-50 rounded-lg p-4 border border-primary-200">
        <div className="flex items-start space-x-3">
          <TrendingUp className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="font-medium text-primary-900 mb-1">
              Recommendation
            </h4>
            <p className="text-sm text-primary-800 mb-2">
              {getRecommendation()}
            </p>
            <div className="text-xs text-primary-700 space-y-1">
              <div>• Start with Preview mode to test your location and categories</div>
              <div>• Use Full mode for most business intelligence needs</div>
              <div>• Choose Unlimited only when you need complete area coverage</div>
            </div>
          </div>
        </div>
      </div>

      {/* Warning for high limits */}
      {maxResults > 200 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start space-x-3 p-4 bg-warning-50 border border-warning-200 rounded-lg"
        >
          <AlertCircle className="h-5 w-5 text-warning-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="font-medium text-warning-900 mb-1">
              High Limit Warning
            </h4>
            <p className="text-sm text-warning-800">
              Searching for {maxResults} businesses may take {estimatedTime} and could trigger 
              Google Maps rate limiting. Consider starting with a lower limit to test your setup.
            </p>
          </div>
        </motion.div>
      )}

      {/* Cost Breakdown */}
      <div className="text-xs text-secondary-500 bg-secondary-50 p-3 rounded border">
        <div className="flex items-center space-x-2 mb-2">
          <Info className="h-3 w-3" />
          <span className="font-medium">Cost Breakdown</span>
        </div>
        <div className="space-y-1">
          <div>• Browser resources: ~$0.001 per business</div>
          <div>• Network requests: ~$0.001 per business  </div>
          <div>• Processing time: ~$0.001 per business</div>
          <div>• These are estimates for planning - actual usage may vary</div>
        </div>
      </div>
    </div>
  );
} 