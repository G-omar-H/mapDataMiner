import { BusinessData, ExportOptions, GoogleSheetsConfig } from '@/types';

export class DataExporter {
  
  static generateCSVContent(data: BusinessData[], options: ExportOptions): string {
    const headers = [
      'Business Name',
      'Address', 
      'Phone',
      'Website',
      'Rating',
      'Review Count',
      'Category',
      'Hours',
      'Coordinates',
      'Scraped At'
    ];

    const csvContent = [
      headers.join(','),
      ...data.map(business => [
        `"${business.name.replace(/"/g, '""')}"`,
        `"${business.address.replace(/"/g, '""')}"`,
        `"${business.phone || ''}"`,
        `"${business.website || ''}"`,
        business.rating || '',
        business.reviewCount || '',
        `"${business.category || ''}"`,
        `"${business.hours || ''}"`,
        business.coordinates ? 
          `"${business.coordinates.lat},${business.coordinates.lng}"` : '',
        business.scrapedAt.toISOString()
      ].join(','))
    ].join('\n');

    return csvContent;
  }

  static async exportToGoogleSheets(
    data: BusinessData[], 
    config: GoogleSheetsConfig,
    options: ExportOptions
  ): Promise<string> {
    try {
      // This would require Google Sheets API setup
      throw new Error('Google Sheets integration requires API setup. Use CSV export for now.');
    } catch (error) {
      console.error('Error exporting to Google Sheets:', error);
      throw new Error('Failed to export to Google Sheets');
    }
  }

  static downloadCSV(csvContent: string, filename: string): void {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
} 