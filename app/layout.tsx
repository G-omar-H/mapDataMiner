import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'MapDataMiner - Professional Business Data Scraper',
  description: 'Extract comprehensive business data from Google Maps with advanced filtering, sorting, and export capabilities. Perfect for lead generation, market research, and business intelligence.',
  keywords: 'business data, Google Maps scraper, lead generation, market research, data mining, CSV export, Google Sheets',
  authors: [{ name: 'MapDataMiner Team' }],
  robots: 'index, follow',
  openGraph: {
    title: 'MapDataMiner - Professional Business Data Scraper',
    description: 'Extract comprehensive business data from Google Maps with advanced filtering and export capabilities.',
    type: 'website',
    siteName: 'MapDataMiner',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MapDataMiner - Professional Business Data Scraper',
    description: 'Extract comprehensive business data from Google Maps with advanced filtering and export capabilities.',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full antialiased`}>
        <div className="min-h-full bg-gradient-to-br from-secondary-50 via-white to-primary-50">
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#fff',
                color: '#334155',
                border: '1px solid #e2e8f0',
                borderRadius: '0.75rem',
                boxShadow: '0 4px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 40px -10px rgba(0, 0, 0, 0.08)',
              },
              success: {
                iconTheme: {
                  primary: '#22c55e',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </div>
      </body>
    </html>
  );
} 