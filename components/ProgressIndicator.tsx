'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Database, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Clock,
  TrendingUp
} from 'lucide-react';
import { ScrapingProgress } from '@/types';

interface ProgressIndicatorProps {
  progress: ScrapingProgress;
}

export default function ProgressIndicator({ progress }: ProgressIndicatorProps) {
  const getStatusIcon = () => {
    switch (progress.status) {
      case 'searching':
        return <Search className="h-5 w-5 text-primary-600 animate-pulse" />;
      case 'scraping':
        return <Database className="h-5 w-5 text-primary-600" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-success-600" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-error-600" />;
      default:
        return <Loader2 className="h-5 w-5 text-secondary-400 animate-spin" />;
    }
  };

  const getStatusColor = () => {
    switch (progress.status) {
      case 'searching':
      case 'scraping':
        return 'primary';
      case 'completed':
        return 'success';
      case 'error':
        return 'error';
      default:
        return 'secondary';
    }
  };

  const statusColor = getStatusColor();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`card border-${statusColor}-200 bg-${statusColor}-50/50`}
    >
      <div className="card-body">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            {getStatusIcon()}
            <div>
              <h3 className={`font-semibold text-${statusColor}-900`}>
                {progress.status === 'searching' && 'Searching for businesses...'}
                {progress.status === 'scraping' && 'Extracting business data...'}
                {progress.status === 'completed' && 'Scraping completed!'}
                {progress.status === 'error' && 'Scraping failed'}
              </h3>
              <p className={`text-sm text-${statusColor}-700`}>
                {progress.currentStep}
              </p>
            </div>
          </div>
          
          {progress.status !== 'error' && (
            <div className="text-right">
              <div className={`text-2xl font-bold text-${statusColor}-600`}>
                {Math.round(progress.progress)}%
              </div>
              {progress.totalFound > 0 && (
                <div className="text-sm text-secondary-600">
                  {progress.scraped} / {progress.totalFound}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="progress-bar mb-4">
          <motion.div
            className={`progress-fill bg-${statusColor}-600`}
            initial={{ width: 0 }}
            animate={{ width: `${progress.progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>

        {/* Stats */}
        {(progress.status === 'scraping' || progress.status === 'completed') && progress.totalFound > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <Search className="h-4 w-4 text-secondary-500 mr-1" />
              </div>
              <div className="text-lg font-semibold text-secondary-900">
                {progress.totalFound}
              </div>
              <div className="text-xs text-secondary-600">Found</div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <Database className="h-4 w-4 text-primary-500 mr-1" />
              </div>
              <div className="text-lg font-semibold text-primary-600">
                {progress.scraped}
              </div>
              <div className="text-xs text-secondary-600">Scraped</div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <TrendingUp className="h-4 w-4 text-success-500 mr-1" />
              </div>
              <div className="text-lg font-semibold text-success-600">
                {progress.totalFound > 0 ? Math.round((progress.scraped / progress.totalFound) * 100) : 0}%
              </div>
              <div className="text-xs text-secondary-600">Success Rate</div>
            </div>
          </div>
        )}

        {/* Processing Steps Visualization */}
        {progress.status === 'scraping' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-secondary-600">Processing steps:</span>
              <span className="text-secondary-500">
                <Clock className="h-4 w-4 inline mr-1" />
                Est. {Math.max(1, Math.round((progress.totalFound - progress.scraped) * 2 / 60))} min remaining
              </span>
            </div>
            
            <div className="flex space-x-1">
              {Array.from({ length: 10 }, (_, i) => {
                const isActive = i < (progress.progress / 10);
                const isProcessing = i === Math.floor(progress.progress / 10);
                
                return (
                  <motion.div
                    key={i}
                    className={`h-2 flex-1 rounded-full ${
                      isActive 
                        ? 'bg-primary-600' 
                        : isProcessing 
                          ? 'bg-primary-400 animate-pulse' 
                          : 'bg-secondary-200'
                    }`}
                    initial={{ scale: 0.8 }}
                    animate={{ scale: isProcessing ? 1.1 : 1 }}
                    transition={{ duration: 0.3 }}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Error Messages */}
        <AnimatePresence>
          {progress.errors.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 p-3 bg-error-100 border border-error-200 rounded-lg"
            >
              <div className="flex items-start">
                <AlertCircle className="h-4 w-4 text-error-600 mr-2 mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  {progress.errors.map((error, index) => (
                    <p key={index} className="text-sm text-error-700">
                      {error}
                    </p>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success Message */}
        {progress.status === 'completed' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 bg-success-100 border border-success-200 rounded-lg"
          >
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-success-600 mr-2" />
              <p className="text-sm text-success-700">
                Successfully scraped {progress.scraped} businesses from {progress.totalFound} found.
                {progress.scraped > 0 && ' Data is ready for export!'}
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
} 