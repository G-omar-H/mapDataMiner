'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, 
  CheckCircle, 
  X, 
  Settings, 
  Key, 
  Map,
  FileSpreadsheet,
  ExternalLink,
  RefreshCw
} from 'lucide-react';

interface ConfigStatus {
  isHealthy: boolean;
  errors: string[];
  warnings: string[];
  environment: {
    nodeEnv: string;
    realScrapingEnabled: boolean;
    googleSheetsEnabled: boolean;
    hasGoogleMapsKey: boolean;
    hasMapboxToken: boolean;
    debugMode: boolean;
  };
}

interface ConfigurationCheckProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ConfigurationCheck({ isOpen, onClose }: ConfigurationCheckProps) {
  const [status, setStatus] = useState<ConfigStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSetupGuide, setShowSetupGuide] = useState(false);

  const checkConfiguration = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/scrape?health=true');
      const data = await response.json();
      setStatus({
        isHealthy: data.validation.isHealthy,
        errors: data.validation.errors,
        warnings: data.validation.warnings,
        environment: data.environment
      });
    } catch (error) {
      console.error('Failed to check configuration:', error);
      setStatus({
        isHealthy: false,
        errors: ['Failed to connect to configuration service'],
        warnings: [],
        environment: {
          nodeEnv: 'unknown',
          realScrapingEnabled: false,
          googleSheetsEnabled: false,
          hasGoogleMapsKey: false,
          hasMapboxToken: false,
          debugMode: false
        }
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      checkConfiguration();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getStatusIcon = (hasFeature: boolean, isRequired: boolean = false) => {
    if (hasFeature) {
      return <CheckCircle className="h-5 w-5 text-success-600" />;
    } else if (isRequired) {
      return <AlertTriangle className="h-5 w-5 text-error-600" />;
    } else {
      return <AlertTriangle className="h-5 w-5 text-warning-600" />;
    }
  };

  const configItems = [
    {
      label: 'Real Scraping',
      description: 'Enable actual Google Maps scraping',
      status: status?.environment.realScrapingEnabled,
      required: true,
      fix: 'Set ENABLE_REAL_SCRAPING=true in .env.local',
      icon: Settings
    },
    {
      label: 'Google Maps API',
      description: 'For reliable scraping and geocoding',
      status: status?.environment.hasGoogleMapsKey,
      required: false,
      fix: 'Add GOOGLE_MAPS_API_KEY to .env.local - see API_SETUP_GUIDE.md',
      icon: Map
    },
    {
      label: 'Mapbox Token',
      description: 'For interactive map visualization',
      status: status?.environment.hasMapboxToken,
      required: false,
      fix: 'Add NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN to .env.local - see API_SETUP_GUIDE.md',
      icon: Map
    },
    {
      label: 'Google Sheets Export',
      description: 'Direct export to Google Sheets',
      status: status?.environment.googleSheetsEnabled && status?.environment.hasGoogleMapsKey,
      required: false,
      fix: 'Configure Google Sheets API credentials - see API_SETUP_GUIDE.md',
      icon: FileSpreadsheet
    }
  ];

  const renderSetupGuide = () => (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <Key className="h-12 w-12 text-primary-600 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-secondary-900 mb-2">
          Complete API Setup Guide
        </h3>
        <p className="text-secondary-600 max-w-2xl mx-auto">
          Follow these step-by-step instructions to configure all API keys and unlock the full potential of MapDataMiner.
        </p>
      </div>

      {/* Quick Setup Steps */}
      <div className="bg-gradient-to-r from-primary-50 to-primary-100 p-6 rounded-xl border border-primary-200">
        <h4 className="font-semibold text-primary-900 mb-4 flex items-center">
          <span className="bg-primary-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm mr-3">1</span>
          Quick Setup Steps
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center p-3 bg-white rounded-lg border border-primary-200">
            <div className="font-medium text-primary-800 mb-1">Copy Template</div>
            <div className="text-primary-600">cp .env.example .env.local</div>
          </div>
          <div className="text-center p-3 bg-white rounded-lg border border-primary-200">
            <div className="font-medium text-primary-800 mb-1">Get API Keys</div>
            <div className="text-primary-600">Follow guides below</div>
          </div>
          <div className="text-center p-3 bg-white rounded-lg border border-primary-200">
            <div className="font-medium text-primary-800 mb-1">Update Config</div>
            <div className="text-primary-600">Edit .env.local file</div>
          </div>
          <div className="text-center p-3 bg-white rounded-lg border border-primary-200">
            <div className="font-medium text-primary-800 mb-1">Restart Server</div>
            <div className="text-primary-600">npm run dev</div>
          </div>
        </div>
      </div>

      {/* Google Maps API */}
      <div className="border border-secondary-200 rounded-xl overflow-hidden">
        <div className="bg-secondary-50 p-4 border-b border-secondary-200">
          <div className="flex items-center space-x-3">
            <Map className="h-6 w-6 text-blue-600" />
            <div>
              <h4 className="font-bold text-secondary-900">Google Maps API</h4>
              <p className="text-sm text-secondary-600">Essential for reliable scraping and geocoding</p>
            </div>
            <div className="ml-auto">
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                Recommended
              </span>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h5 className="font-semibold text-secondary-900">Step-by-Step Setup</h5>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <span className="bg-blue-100 text-blue-800 w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium">1</span>
                  <div>
                    <div className="font-medium text-secondary-900">Create Google Cloud Project</div>
                    <div className="text-sm text-secondary-600">Go to Google Cloud Console and create a new project</div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="bg-blue-100 text-blue-800 w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium">2</span>
                  <div>
                    <div className="font-medium text-secondary-900">Enable APIs</div>
                    <div className="text-sm text-secondary-600">Enable Maps JavaScript API, Places API, and Geocoding API</div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="bg-blue-100 text-blue-800 w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium">3</span>
                  <div>
                    <div className="font-medium text-secondary-900">Create API Key</div>
                    <div className="text-sm text-secondary-600">Generate a new API key in the Credentials section</div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="bg-blue-100 text-blue-800 w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium">4</span>
                  <div>
                    <div className="font-medium text-secondary-900">Restrict Key (Optional)</div>
                    <div className="text-sm text-secondary-600">Add HTTP referrer restrictions for security</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h5 className="font-semibold text-secondary-900">Configuration</h5>
              <div className="bg-secondary-900 text-secondary-100 p-4 rounded-lg font-mono text-sm">
                <div className="text-green-400"># Add to .env.local</div>
                <div className="text-white">GOOGLE_MAPS_API_KEY=AIzaSyBkVoL_YourActualAPIKeyHere</div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-start space-x-2">
                  <div className="text-blue-600 mt-0.5">💡</div>
                  <div className="text-sm text-blue-800">
                    <strong>Free Tier:</strong> 28,000 map loads per month<br/>
                    <strong>Places API:</strong> $17 per 1,000 requests after free tier
                  </div>
                </div>
              </div>
              <a 
                href="https://console.cloud.google.com/apis/credentials" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Google Cloud Console
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Mapbox */}
      <div className="border border-secondary-200 rounded-xl overflow-hidden">
        <div className="bg-secondary-50 p-4 border-b border-secondary-200">
          <div className="flex items-center space-x-3">
            <Map className="h-6 w-6 text-green-600" />
            <div>
              <h4 className="font-bold text-secondary-900">Mapbox Token</h4>
              <p className="text-sm text-secondary-600">For interactive map visualization and display</p>
            </div>
            <div className="ml-auto">
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">
                Maps Only
              </span>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h5 className="font-semibold text-secondary-900">Simple Setup</h5>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <span className="bg-green-100 text-green-800 w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium">1</span>
                  <div>
                    <div className="font-medium text-secondary-900">Create Mapbox Account</div>
                    <div className="text-sm text-secondary-600">Sign up for a free account at mapbox.com</div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="bg-green-100 text-green-800 w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium">2</span>
                  <div>
                    <div className="font-medium text-secondary-900">Get Access Token</div>
                    <div className="text-sm text-secondary-600">Copy your default public token or create a new one</div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="bg-green-100 text-green-800 w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium">3</span>
                  <div>
                    <div className="font-medium text-secondary-900">Add to Configuration</div>
                    <div className="text-sm text-secondary-600">Paste the token in your .env.local file</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h5 className="font-semibold text-secondary-900">Configuration</h5>
              <div className="bg-secondary-900 text-secondary-100 p-4 rounded-lg font-mono text-sm">
                <div className="text-green-400"># Add to .env.local</div>
                <div className="text-white">NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.eyJ1IjoieW91ci11c2VyIi...</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-start space-x-2">
                  <div className="text-green-600 mt-0.5">💰</div>
                  <div className="text-sm text-green-800">
                    <strong>Free Tier:</strong> 50,000 map loads per month<br/>
                    <strong>Pricing:</strong> $5 per 1,000 loads after free tier
                  </div>
                </div>
              </div>
              <a 
                href="https://account.mapbox.com/access-tokens/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Get Mapbox Token
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Google Sheets */}
      <div className="border border-secondary-200 rounded-xl overflow-hidden">
        <div className="bg-secondary-50 p-4 border-b border-secondary-200">
          <div className="flex items-center space-x-3">
            <FileSpreadsheet className="h-6 w-6 text-purple-600" />
            <div>
              <h4 className="font-bold text-secondary-900">Google Sheets API</h4>
              <p className="text-sm text-secondary-600">For direct export to Google Sheets (advanced)</p>
            </div>
            <div className="ml-auto">
              <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded">
                Optional
              </span>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h5 className="font-semibold text-secondary-900">Advanced Setup</h5>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <span className="bg-purple-100 text-purple-800 w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium">1</span>
                  <div>
                    <div className="font-medium text-secondary-900">Create Service Account</div>
                    <div className="text-sm text-secondary-600">In Google Cloud Console, create a service account</div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="bg-purple-100 text-purple-800 w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium">2</span>
                  <div>
                    <div className="font-medium text-secondary-900">Download JSON Key</div>
                    <div className="text-sm text-secondary-600">Generate and download the JSON credentials file</div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="bg-purple-100 text-purple-800 w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium">3</span>
                  <div>
                    <div className="font-medium text-secondary-900">Extract Credentials</div>
                    <div className="text-sm text-secondary-600">Copy client_email and private_key from JSON</div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="bg-purple-100 text-purple-800 w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium">4</span>
                  <div>
                    <div className="font-medium text-secondary-900">Share Sheets</div>
                    <div className="text-sm text-secondary-600">Share your sheets with the service account email</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h5 className="font-semibold text-secondary-900">Configuration</h5>
              <div className="bg-secondary-900 text-secondary-100 p-4 rounded-lg font-mono text-sm">
                <div className="text-green-400"># Add to .env.local</div>
                <div className="text-white">ENABLE_GOOGLE_SHEETS_EXPORT=true</div>
                <div className="text-white">GOOGLE_CLIENT_EMAIL=service@project.iam.gserviceaccount.com</div>
                <div className="text-white">GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"</div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <div className="flex items-start space-x-2">
                  <div className="text-orange-600 mt-0.5">⚠️</div>
                  <div className="text-sm text-orange-800">
                    <strong>Important:</strong> Keep the exact formatting of the private key with \n characters as shown above.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Testing & Troubleshooting */}
      <div className="border border-secondary-200 rounded-xl overflow-hidden">
        <div className="bg-secondary-50 p-4 border-b border-secondary-200">
          <div className="flex items-center space-x-3">
            <Settings className="h-6 w-6 text-orange-600" />
            <div>
              <h4 className="font-bold text-secondary-900">Testing & Troubleshooting</h4>
              <p className="text-sm text-secondary-600">How to verify your setup and fix common issues</p>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h5 className="font-semibold text-secondary-900">Testing Your Setup</h5>
              <div className="space-y-3">
                <div className="bg-secondary-900 text-secondary-100 p-3 rounded-lg font-mono text-sm">
                  <div className="text-green-400"># Restart server after changes</div>
                  <div className="text-white">npm run dev</div>
                </div>
                <div className="bg-secondary-900 text-secondary-100 p-3 rounded-lg font-mono text-sm">
                  <div className="text-green-400"># Check configuration status</div>
                  <div className="text-white">curl http://localhost:3000/api/scrape?health=true</div>
                </div>
                <div className="space-y-2">
                  <div className="font-medium text-secondary-900">In the UI:</div>
                  <div className="text-sm text-secondary-600">1. Click "Config" button to check status</div>
                  <div className="text-sm text-secondary-600">2. Try a test search</div>
                  <div className="text-sm text-secondary-600">3. Check for warnings in notifications</div>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h5 className="font-semibold text-secondary-900">Common Issues</h5>
              <div className="space-y-3">
                <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                  <div className="font-medium text-red-900">API Key Invalid</div>
                  <div className="text-sm text-red-700">Check if APIs are enabled in Google Cloud Console</div>
                </div>
                <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                  <div className="font-medium text-yellow-900">Quota Exceeded</div>
                  <div className="text-sm text-yellow-700">Monitor usage in Google Cloud Console</div>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <div className="font-medium text-blue-900">Sheets Access Error</div>
                  <div className="text-sm text-blue-700">Ensure service account has access to your sheets</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cost Information */}
      <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
        <h4 className="font-semibold text-green-900 mb-4 flex items-center">
          <span className="bg-green-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm mr-3">💰</span>
          Cost Overview
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg border border-green-200">
            <div className="font-semibold text-green-900 mb-2">Google Maps API</div>
            <div className="text-sm text-green-800">
              <div>✅ 28,000 map loads/month free</div>
              <div>💵 $0.007 per additional load</div>
              <div>📍 Places API: $17/1,000 requests</div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-green-200">
            <div className="font-semibold text-green-900 mb-2">Mapbox</div>
            <div className="text-sm text-green-800">
              <div>✅ 50,000 map loads/month free</div>
              <div>💵 $5 per 1,000 additional loads</div>
              <div>🗺️ Great free tier for small projects</div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-green-200">
            <div className="font-semibold text-green-900 mb-2">Google Sheets</div>
            <div className="text-sm text-green-800">
              <div>✅ 300 requests/minute free</div>
              <div>💵 Higher quotas available</div>
              <div>📊 Perfect for data export</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <AnimatePresence>
      <div className="modal-overlay" onClick={onClose}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
          className={`modal-content ${showSetupGuide ? 'max-w-6xl' : 'max-w-3xl'}`}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-secondary-200">
            <div className="flex items-center space-x-3">
              {showSetupGuide ? (
                <Key className="h-6 w-6 text-primary-600" />
              ) : (
                <Settings className="h-6 w-6 text-primary-600" />
              )}
              <div>
                <h2 className="text-xl font-semibold text-secondary-900">
                  {showSetupGuide ? 'API Setup Guide' : 'Configuration Status'}
                </h2>
                <p className="text-sm text-secondary-600 mt-1">
                  {showSetupGuide 
                    ? 'Complete step-by-step instructions to configure all API keys'
                    : 'Check your application setup and API configuration'
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={checkConfiguration}
                disabled={loading}
                className="btn-secondary"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={onClose}
                className="text-secondary-400 hover:text-secondary-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {showSetupGuide ? renderSetupGuide() : (
              <>
                {/* Overall Status */}
                <div className={`p-4 rounded-lg border-2 ${
                  status?.isHealthy 
                    ? 'border-success-200 bg-success-50' 
                    : 'border-warning-200 bg-warning-50'
                }`}>
                  <div className="flex items-center space-x-3">
                    {status?.isHealthy ? (
                      <CheckCircle className="h-6 w-6 text-success-600" />
                    ) : (
                      <AlertTriangle className="h-6 w-6 text-warning-600" />
                    )}
                    <div>
                      <h3 className={`font-semibold ${
                        status?.isHealthy ? 'text-success-900' : 'text-warning-900'
                      }`}>
                        {status?.isHealthy ? 'Configuration Healthy' : 'Configuration Issues Found'}
                      </h3>
                      <p className={`text-sm ${
                        status?.isHealthy ? 'text-success-700' : 'text-warning-700'
                      }`}>
                        {status?.isHealthy 
                          ? 'Your application is properly configured and ready to use'
                          : 'Some features may not work properly without proper configuration'
                        }
                      </p>
                    </div>
                  </div>
                </div>

                {/* Configuration Items */}
                <div className="space-y-4">
                  <h4 className="font-medium text-secondary-900">Feature Configuration</h4>
                  {configItems.map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <motion.div
                        key={item.label}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-start space-x-4 p-4 border border-secondary-200 rounded-lg"
                      >
                        <Icon className="h-5 w-5 text-secondary-500 mt-0.5" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h5 className="font-medium text-secondary-900">{item.label}</h5>
                            {getStatusIcon(item.status || false, item.required)}
                          </div>
                          <p className="text-sm text-secondary-600 mt-1">{item.description}</p>
                          {!item.status && (
                            <p className="text-xs text-secondary-500 mt-2">
                              💡 {item.fix}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Errors and Warnings */}
                {(status?.errors.length || status?.warnings.length) && (
                  <div className="space-y-4">
                    {status.errors.length > 0 && (
                      <div>
                        <h4 className="font-medium text-error-900 mb-2">Critical Issues</h4>
                        <div className="space-y-2">
                          {status.errors.map((error, index) => (
                            <div key={index} className="flex items-start space-x-2 text-sm text-error-700">
                              <AlertTriangle className="h-4 w-4 text-error-600 mt-0.5 flex-shrink-0" />
                              <span>{error}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {status.warnings.length > 0 && (
                      <div>
                        <h4 className="font-medium text-warning-900 mb-2">Recommendations</h4>
                        <div className="space-y-2">
                          {status.warnings.map((warning, index) => (
                            <div key={index} className="flex items-start space-x-2 text-sm text-warning-700">
                              <AlertTriangle className="h-4 w-4 text-warning-600 mt-0.5 flex-shrink-0" />
                              <span>{warning}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Help Section */}
                <div className="border-t border-secondary-200 pt-6">
                  <h4 className="font-medium text-secondary-900 mb-3">Need Help?</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3 p-3 bg-secondary-50 rounded-lg">
                      <Key className="h-5 w-5 text-primary-600" />
                      <div>
                        <h5 className="font-medium text-secondary-900">API Setup Guide</h5>
                        <p className="text-sm text-secondary-600">Detailed instructions for all APIs</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-secondary-50 rounded-lg">
                      <ExternalLink className="h-5 w-5 text-primary-600" />
                      <div>
                        <h5 className="font-medium text-secondary-900">Documentation</h5>
                        <p className="text-sm text-secondary-600">Complete setup documentation</p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-secondary-200">
            <div className="flex items-center space-x-2">
              {showSetupGuide && (
                <button
                  onClick={() => setShowSetupGuide(false)}
                  className="btn-secondary"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Back to Status
                </button>
              )}
            </div>
            <div className="flex items-center space-x-3">
              <button onClick={onClose} className="btn-secondary">
                Close
              </button>
              <button
                onClick={() => setShowSetupGuide(!showSetupGuide)}
                className="btn-primary"
              >
                {showSetupGuide ? (
                  <>
                    <Settings className="h-4 w-4 mr-2" />
                    View Status
                  </>
                ) : (
                  <>
                    <Key className="h-4 w-4 mr-2" />
                    Setup Guide
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
} 