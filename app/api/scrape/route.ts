import { NextRequest, NextResponse } from 'next/server';
import { GoogleMapsScraper } from '@/lib/scraper';
import { SearchParams } from '@/types';
import { setGlobalScraperInstance, clearGlobalScraperInstance } from '@/lib/scraper-manager';
import { validateSearchParams } from '@/utils/validation';

// Validate environment variables
function validateEnvironment() {
  const requiredVars = {
    GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY,
    NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN,
  };

  const missing = Object.entries(requiredVars)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  const warnings = [];
  
  // Add warnings for optional but recommended variables
  if (!process.env.GOOGLE_SHEETS_API_KEY) {
    warnings.push('GOOGLE_SHEETS_API_KEY not set - Google Sheets export will be disabled');
  }

  return { errors: missing, warnings };
}

export async function POST(request: NextRequest) {
  try {
    // Validate environment first
    const missingVars = validateEnvironment();
    
    if (missingVars.errors.length > 0) {
      return NextResponse.json(
        { 
          error: 'Configuration Error',
          message: 'Application is not properly configured',
          details: missingVars.errors,
          fix: 'Please check your .env.local file and ensure all required environment variables are set. See API_SETUP_GUIDE.md for detailed instructions.'
        },
        { status: 500 }
      );
    }

    // Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        { 
          error: 'Invalid Request',
          message: 'Request body must be valid JSON',
          details: ['The request body could not be parsed as JSON'],
          fix: 'Please ensure you are sending a valid JSON object with location, category, and radius fields'
        },
        { status: 400 }
      );
    }
    
    // Validate search parameters
    const validation = validateSearchParams(body);
    if (!validation.success) {
      const errorDetails = validation.error.issues.map((issue: any) => 
        `${issue.path.join('.')}: ${issue.message}`
      );
      
      return NextResponse.json(
        { 
          error: 'Invalid Search Parameters',
          message: 'The provided search parameters are invalid',
          details: errorDetails,
          fix: 'Please provide a valid location (string), radius (100-50000 meters), and optionally a category'
        },
        { status: 400 }
      );
    }

    const params = validation.data;
    
    // Check if real scraping is enabled
    const realScrapingEnabled = process.env.ENABLE_REAL_SCRAPING === 'true';
    
    if (!realScrapingEnabled) {
      return NextResponse.json(
        { 
          error: 'Scraping Not Enabled',
          message: 'Real Google Maps scraping is currently disabled',
          details: ['ENABLE_REAL_SCRAPING is set to false in environment configuration'],
          fix: 'Set ENABLE_REAL_SCRAPING=true in your .env.local file to enable real scraping. Make sure you have proper API keys configured.'
        },
        { status: 503 }
      );
    }

    // Check if streaming is requested
    const useStreaming = request.headers.get('accept') === 'text/event-stream';
    
    if (useStreaming) {
      // Create streaming response for real-time updates
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          const scraper = new GoogleMapsScraper((progress) => {
            // Send progress update via Server-Sent Events
            const sseData = `data: ${JSON.stringify({
              type: 'progress',
              ...progress
            })}\n\n`;
            controller.enqueue(encoder.encode(sseData));
          });

          // Start scraping asynchronously
          (async () => {
            try {
              await scraper.initialize();
              const businesses = await scraper.scrapeBusinesses(params);
              
              // Send final result
              const finalData = `data: ${JSON.stringify({
                type: 'complete',
                success: true,
                businesses,
                count: businesses.length,
                searchParams: params,
                warnings: missingVars.warnings.length > 0 ? missingVars.warnings : undefined
              })}\n\n`;
              controller.enqueue(encoder.encode(finalData));
              controller.close();
              
            } catch (error: any) {
              // Send error via SSE
              const errorData = `data: ${JSON.stringify({
                type: 'error',
                error: 'Scraping Failed',
                message: error.message || 'Unknown scraping error'
              })}\n\n`;
              controller.enqueue(encoder.encode(errorData));
              controller.close();
            } finally {
              await scraper.close();
            }
          })();
        }
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // Existing non-streaming implementation for backward compatibility
    // Validate scraping parameters
    const maxBusinesses = parseInt(process.env.MAX_BUSINESSES_PER_SEARCH || '100');
    const baseTimeout = parseInt(process.env.SCRAPING_TIMEOUT || '600000'); // 10 minutes base timeout
    const minDelay = parseInt(process.env.SCRAPING_DELAY_MIN || '1000');
    const maxDelay = parseInt(process.env.SCRAPING_DELAY_MAX || '3000');

    // Calculate intelligent timeout based on number of businesses to scrape
    const businessesToScrape = Math.min(params.maxResults || 30, maxBusinesses);
    const estimatedTimePerBusiness = 15000; // 15 seconds per business (including delays)
    const intelligentTimeout = Math.max(baseTimeout, businessesToScrape * estimatedTimePerBusiness);
    
    console.log(`⏱️ Calculated timeout: ${intelligentTimeout}ms (${Math.round(intelligentTimeout/1000/60)} minutes) for ${businessesToScrape} businesses`);

    if (minDelay >= maxDelay) {
      return NextResponse.json(
        { 
          error: 'Configuration Error',
          message: 'Invalid scraping delay configuration',
          details: ['SCRAPING_DELAY_MIN must be less than SCRAPING_DELAY_MAX'],
          fix: 'Update your .env.local file with valid delay values (e.g., SCRAPING_DELAY_MIN=1000, SCRAPING_DELAY_MAX=3000)'
        },
        { status: 500 }
      );
    }

    // Initialize scraper with progress callback
    const scraper = new GoogleMapsScraper((progress) => {
      // This could be enhanced with WebSocket for real-time updates
      console.log(`Scraping progress: ${progress.currentStep} - ${progress.progress}%`);
    });
    
    let businesses = [];
    
    try {
      // Initialize the scraper
      console.log('Initializing Google Maps scraper...');
      await scraper.initialize();
      
      // Perform scraping with timeout and result limit
      const scrapingPromise = scraper.scrapeBusinesses(params);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Scraping operation timed out')), intelligentTimeout)
      );
      
      const allBusinesses = await Promise.race([scrapingPromise, timeoutPromise]) as any[];
      
      // Limit results based on maxResults parameter
      businesses = allBusinesses.slice(0, params.maxResults);
      
      if (!businesses || businesses.length === 0) {
        return NextResponse.json(
          { 
            error: 'No Results Found',
            message: 'No businesses were found for your search criteria',
            details: [
              `Location: ${params.location}`,
              `Categories: ${params.categories.length === 0 ? 'any' : params.categories.join(', ')}`,
              `Radius: ${params.radius} meters`
            ],
            fix: 'Try expanding your search radius, changing the location, or using a different category. Make sure the location name is correct and commonly recognized.',
            searchParams: params,
            suggestions: [
              'Use a more general location (e.g., "Paris" instead of "Paris 7th arrondissement")',
              'Try a broader category or remove category filter',
              'Increase the search radius',
              'Check if the location name is spelled correctly'
            ]
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        businesses,
        count: businesses.length,
        searchParams: params,
        timestamp: new Date().toISOString(),
        warnings: missingVars.warnings.length > 0 ? missingVars.warnings : undefined
      });
      
    } catch (scrapingError: any) {
      console.error('Scraping error details:', scrapingError);
      
      // Handle specific scraping errors with better user messages
      if (scrapingError.message?.includes('Browser initialization failed')) {
        return NextResponse.json(
          { 
            error: 'Browser Setup Error',
            message: 'Failed to initialize the scraping browser',
            details: ['The automated browser could not be started. This might be due to system limitations or missing dependencies.'],
            fix: 'Try restarting the application or check if you have sufficient system resources. On some systems, you may need to install additional Chrome dependencies.',
            suggestions: [
              'Restart the application',
              'Check system memory and CPU usage',
              'Ensure Chrome/Chromium is properly installed',
              'Try reducing MAX_CONCURRENT_SCRAPERS in .env.local'
            ]
          },
          { status: 500 }
        );
      }
      
      if (scrapingError.message?.includes('timeout')) {
        return NextResponse.json(
          { 
            error: 'Scraping Timeout',
            message: 'The scraping operation took too long and was cancelled',
            details: [`Operation timed out after ${intelligentTimeout / 1000} seconds`],
            fix: 'Google Maps may be slow or blocking automated access. Try again later with a smaller search area.',
            suggestions: [
              'Reduce the search radius',
              'Try a different location',
              'Wait a few minutes before trying again',
              'Consider adding a Google Maps API key for better reliability'
            ]
          },
          { status: 408 }
        );
      }
      
      if (scrapingError.message?.includes('No search results found') || scrapingError.message?.includes('No businesses found')) {
        return NextResponse.json(
          { 
            error: 'No Results Found',
            message: 'No businesses were found for your search criteria',
            details: [
              `Location: ${params.location}`,
              `Categories: ${params.categories.length === 0 ? 'any' : params.categories.join(', ')}`,
              `Radius: ${params.radius} meters`
            ],
            fix: 'The location might not exist or have businesses in the specified category. Try a different location or broader search terms.',
            suggestions: [
              'Use a more general location (e.g., "Paris" instead of specific districts)',
              'Try a broader category or remove category filter',
              'Increase the search radius',
              'Check if the location name is spelled correctly',
              'Try popular city names like "New York", "London", "Paris"'
            ]
          },
          { status: 404 }
        );
      }
      
      if (scrapingError.message?.includes('blocked') || scrapingError.message?.includes('captcha') || scrapingError.message?.includes('rate limit')) {
        return NextResponse.json(
          { 
            error: 'Access Blocked',
            message: 'Google Maps has temporarily blocked automated access',
            details: ['This is usually temporary and related to rate limiting or anti-bot measures'],
            fix: 'Wait a few minutes before trying again. Consider adding a Google Maps API key for more reliable access.',
            suggestions: [
              'Wait 5-10 minutes before trying again',
              'Add GOOGLE_MAPS_API_KEY to your configuration',
              'Increase delays between requests',
              'Try from a different network/location'
            ]
          },
          { status: 429 }
        );
      }
      
      if (scrapingError.message?.includes('navigation') || scrapingError.message?.includes('page') || scrapingError.message?.includes('net::')) {
        return NextResponse.json(
          { 
            error: 'Connection Error',
            message: 'Failed to connect to Google Maps',
            details: [scrapingError.message],
            fix: 'This appears to be a network connectivity issue. Check your internet connection and try again.',
            suggestions: [
              'Check your internet connection',
              'Try again in a few moments',
              'Verify that Google Maps is accessible in your region',
              'Check if you\'re behind a firewall or proxy'
            ]
          },
          { status: 502 }
        );
      }

      // Generic scraping error with more helpful message
      return NextResponse.json(
        { 
          error: 'Scraping Failed',
          message: 'An error occurred while scraping Google Maps',
          details: [scrapingError.message || 'Unknown scraping error'],
          fix: 'This might be due to changes in Google Maps structure or system issues. Try again later.',
          suggestions: [
            'Try again in a few minutes',
            'Check if Google Maps is working normally in your browser',
            'Consider adding API keys for more reliable scraping',
            'Try a different search location or category'
          ],
          technicalInfo: process.env.DEBUG_MODE === 'true' ? {
            stack: scrapingError.stack,
            searchParams: params,
            timestamp: new Date().toISOString()
          } : undefined
        },
        { status: 500 }
      );
      
    } finally {
      // Always clean up browser resources
      try {
        await scraper.close();
      } catch (closeError) {
        console.error('Error closing scraper:', closeError);
      }
    }
    
  } catch (error: any) {
    console.error('Unexpected API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
        details: [error.message || 'Unknown server error'],
        fix: 'This is an internal server error. Please try again later or contact support.',
        timestamp: new Date().toISOString(),
        technicalInfo: process.env.DEBUG_MODE === 'true' ? {
          stack: error.stack
        } : undefined
      },
      { status: 500 }
    );
  }
}

// Health check endpoint - no more mock data
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const healthCheck = searchParams.get('health');
  
  if (healthCheck === 'true') {
    const { errors, warnings } = validateEnvironment();
    
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        realScrapingEnabled: process.env.ENABLE_REAL_SCRAPING === 'true',
        googleSheetsEnabled: process.env.ENABLE_GOOGLE_SHEETS_EXPORT === 'true',
        hasGoogleMapsKey: !!process.env.GOOGLE_MAPS_API_KEY,
        hasMapboxToken: !!process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN,
        debugMode: process.env.DEBUG_MODE === 'true'
      },
      validation: {
        errors,
        warnings,
        isHealthy: errors.length === 0
      }
    });
  }
  
  return NextResponse.json(
    { 
      error: 'Method Not Allowed',
      message: 'Mock data has been removed. Use POST for scraping or GET with ?health=true for health check',
      details: ['This endpoint only supports POST requests for real scraping'],
      fix: 'Use POST /api/scrape with proper search parameters, or enable real scraping in your configuration'
    },
    { status: 405 }
  );
} 