'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Download, 
  FileSpreadsheet, 
  CheckCircle, 
  Loader2,
  ExternalLink,
  Settings
} from 'lucide-react';
import toast from 'react-hot-toast';
import { BusinessData } from '@/types';
import { DataExporter } from '@/lib/export';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  businesses: BusinessData[];
}

export default function ExportModal({ isOpen, onClose, businesses }: ExportModalProps) {
  const [exportType, setExportType] = useState<'csv' | 'sheets'>('csv');
  const [isExporting, setIsExporting] = useState(false);
  const [selectedFields, setSelectedFields] = useState<string[]>([
    'name', 'address', 'phone', 'website', 'rating', 'reviewCount', 'category'
  ]);
  const [sheetName, setSheetName] = useState('Business Data');
  const [includePhotos, setIncludePhotos] = useState(false);

  const availableFields = [
    { id: 'name', label: 'Business Name', required: true },
    { id: 'address', label: 'Address', required: false },
    { id: 'phone', label: 'Phone Number', required: false },
    { id: 'website', label: 'Website', required: false },
    { id: 'rating', label: 'Rating', required: false },
    { id: 'reviewCount', label: 'Review Count', required: false },
    { id: 'category', label: 'Category', required: false },
    { id: 'hours', label: 'Operating Hours', required: false },
    { id: 'coordinates', label: 'Coordinates', required: false },
    { id: 'scrapedAt', label: 'Scraped Date', required: false },
  ];

  const handleFieldToggle = (fieldId: string) => {
    const field = availableFields.find(f => f.id === fieldId);
    if (field?.required) return; // Can't uncheck required fields

    setSelectedFields(prev => 
      prev.includes(fieldId)
        ? prev.filter(id => id !== fieldId)
        : [...prev, fieldId]
    );
  };

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const csvContent = DataExporter.generateCSVContent(businesses, {
        format: 'csv',
        includePhotos,
        selectedFields
      });

      const filename = `business_data_${new Date().toISOString().split('T')[0]}.csv`;
      DataExporter.downloadCSV(csvContent, filename);
      
      toast.success(`Successfully exported ${businesses.length} businesses to CSV!`);
      onClose();
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportSheets = async () => {
    setIsExporting(true);
    try {
      // This would require Google Sheets API setup
      toast.error('Google Sheets integration requires API setup. Use CSV export for now.');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export to Google Sheets. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExport = () => {
    if (exportType === 'csv') {
      handleExportCSV();
    } else {
      handleExportSheets();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="modal-overlay" onClick={onClose}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
          className="modal-content"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-secondary-200">
            <div>
              <h2 className="text-xl font-semibold text-secondary-900">
                Export Business Data
              </h2>
              <p className="text-sm text-secondary-600 mt-1">
                Export {businesses.length} businesses to your preferred format
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-secondary-400 hover:text-secondary-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Export Type Selection */}
            <div className="space-y-3">
              <label className="label">Export Format</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setExportType('csv')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    exportType === 'csv'
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-secondary-200 hover:border-secondary-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Download className="h-5 w-5 text-primary-600" />
                    <div className="text-left">
                      <div className="font-medium text-secondary-900">CSV File</div>
                      <div className="text-sm text-secondary-600">
                        Download as spreadsheet
                      </div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setExportType('sheets')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    exportType === 'sheets'
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-secondary-200 hover:border-secondary-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <FileSpreadsheet className="h-5 w-5 text-success-600" />
                    <div className="text-left">
                      <div className="font-medium text-secondary-900">Google Sheets</div>
                      <div className="text-sm text-secondary-600">
                        Export directly to Sheets
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Google Sheets Options */}
            {exportType === 'sheets' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-3"
              >
                <label className="label">Sheet Name</label>
                <input
                  type="text"
                  value={sheetName}
                  onChange={(e) => setSheetName(e.target.value)}
                  className="input"
                  placeholder="Enter sheet name"
                />
                <div className="flex items-center p-3 bg-warning-50 border border-warning-200 rounded-lg">
                  <Settings className="h-4 w-4 text-warning-600 mr-2 flex-shrink-0" />
                  <p className="text-sm text-warning-700">
                    Google Sheets export requires API configuration in your environment settings.
                  </p>
                </div>
              </motion.div>
            )}

            {/* Field Selection */}
            <div className="space-y-3">
              <label className="label">Select Fields to Export</label>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-3 border border-secondary-200 rounded-lg">
                {availableFields.map((field) => (
                  <label key={field.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={selectedFields.includes(field.id)}
                      onChange={() => handleFieldToggle(field.id)}
                      disabled={field.required}
                      className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className={`text-sm ${
                      field.required ? 'text-secondary-900 font-medium' : 'text-secondary-700'
                    }`}>
                      {field.label}
                      {field.required && ' *'}
                    </span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-secondary-500">
                * Required fields cannot be deselected
              </p>
            </div>

            {/* Additional Options */}
            <div className="space-y-3">
              <label className="label">Additional Options</label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={includePhotos}
                  onChange={(e) => setIncludePhotos(e.target.checked)}
                  className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-secondary-700">
                  Include photo URLs (when available)
                </span>
              </label>
            </div>

            {/* Export Summary */}
            <div className="bg-secondary-50 p-4 rounded-lg">
              <h4 className="font-medium text-secondary-900 mb-2">Export Summary</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-secondary-600">Businesses: </span>
                  <span className="font-medium text-secondary-900">{businesses.length}</span>
                </div>
                <div>
                  <span className="text-secondary-600">Fields: </span>
                  <span className="font-medium text-secondary-900">{selectedFields.length}</span>
                </div>
                <div>
                  <span className="text-secondary-600">Format: </span>
                  <span className="font-medium text-secondary-900">
                    {exportType === 'csv' ? 'CSV' : 'Google Sheets'}
                  </span>
                </div>
                <div>
                  <span className="text-secondary-600">Photos: </span>
                  <span className="font-medium text-secondary-900">
                    {includePhotos ? 'Included' : 'Excluded'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-secondary-200">
            <button
              onClick={onClose}
              className="btn-secondary"
              disabled={isExporting}
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting || selectedFields.length === 0}
              className="btn-primary"
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  {exportType === 'csv' ? (
                    <Download className="h-4 w-4 mr-2" />
                  ) : (
                    <ExternalLink className="h-4 w-4 mr-2" />
                  )}
                  Export Data
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
 