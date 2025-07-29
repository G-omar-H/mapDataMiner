import puppeteer, { Browser, Page } from 'puppeteer-core';
// @ts-ignore - @sparticuz/chromium doesn't have TypeScript definitions
import chromium from '@sparticuz/chromium';
import { BusinessData, SearchParams, ScrapingProgress } from '@/types';

export type ScrapingState = 'running' | 'paused' | 'cancelled' | 'completed';

export class GoogleMapsScraper {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private progressCallback?: (progress: ScrapingProgress) => void;
  private scrapingState: ScrapingState = 'running' as ScrapingState;
  private scrapedBusinesses: BusinessData[] = [];
  private currentBusinessIndex: number = 0;
  private totalBusinessesToScrape: number = 0;
  private businessLinks: string[] = [];
  private lastHealthCheck: number = Date.now();
  private healthCheckInterval: number = 60000; // 1 minute

  constructor(progressCallback?: (progress: ScrapingProgress) => void) {
    this.progressCallback = progressCallback;
  }

  // Control methods for pause/resume/cancel
  pause(): void {
    console.log('⏸️ Scraping paused by user');
    this.scrapingState = 'paused';
    this.updateProgress({
      status: 'paused',
      currentStep: 'Scraping paused by user',
      progress: Math.round((this.currentBusinessIndex / this.totalBusinessesToScrape) * 100),
      totalFound: this.totalBusinessesToScrape,
      scraped: this.scrapedBusinesses.length,
      errors: []
    });
  }

  resume(): void {
    console.log('▶️ Scraping resumed by user');
    this.scrapingState = 'running';
    this.updateProgress({
      status: 'scraping',
      currentStep: 'Scraping resumed...',
      progress: Math.round((this.currentBusinessIndex / this.totalBusinessesToScrape) * 100),
      totalFound: this.totalBusinessesToScrape,
      scraped: this.scrapedBusinesses.length,
      errors: []
    });
  }

  cancel(): void {
    console.log('❌ Scraping cancelled by user');
    this.scrapingState = 'cancelled';
    this.updateProgress({
      status: 'cancelled',
      currentStep: 'Scraping cancelled by user',
      progress: Math.round((this.currentBusinessIndex / this.totalBusinessesToScrape) * 100),
      totalFound: this.totalBusinessesToScrape,
      scraped: this.scrapedBusinesses.length,
      errors: []
    });
  }

  getState(): ScrapingState {
    return this.scrapingState;
  }

  getProgress(): { scraped: number; total: number; businesses: BusinessData[] } {
    return {
      scraped: this.scrapedBusinesses.length,
      total: this.totalBusinessesToScrape,
      businesses: this.scrapedBusinesses
    };
  }

  // Wait for resume when paused
  private async waitForResume(): Promise<void> {
    while (this.scrapingState === 'paused') {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // Check if scraping should continue
  private shouldContinueScraping(): boolean {
    return this.scrapingState === 'running';
  }

  private isCancelled(): boolean {
    return this.scrapingState === 'cancelled';
  }

  private isPaused(): boolean {
    return this.scrapingState === 'paused';
  }

  // Health check method to prevent browser disconnection
  private async performHealthCheck(): Promise<boolean> {
    const now = Date.now();
    if (now - this.lastHealthCheck < this.healthCheckInterval) {
      return true; // Skip health check if not enough time has passed
    }

    try {
      if (!this.browser || !this.page) {
        console.log('⚠️ Browser or page not available during health check');
        return false;
      }

      // Check if browser is still connected
      if (!this.browser.connected) {
        console.log('⚠️ Browser disconnected during health check');
        return false;
      }

      // Check if page is still responsive
      await this.page.evaluate(() => document.readyState);
      
      this.lastHealthCheck = now;
      return true;
    } catch (error) {
      console.log('⚠️ Health check failed:', error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }

  // Reinitialize browser if health check fails
  private async ensureBrowserHealth(): Promise<boolean> {
    const isHealthy = await this.performHealthCheck();
    
    if (!isHealthy) {
      console.log('🔄 Browser health check failed, reinitializing...');
      try {
        await this.initialize();
        console.log('✅ Browser reinitialized successfully');
        return true;
      } catch (error) {
        console.error('❌ Failed to reinitialize browser:', error);
        return false;
      }
    }
    
    return true;
  }

  async initialize(): Promise<void> {
    try {
      // Close any existing browser first
      if (this.browser) {
        await this.browser.close().catch(() => {});
        this.browser = null;
        this.page = null;
      }

      const isProduction = process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production';
      
      console.log(`🚀 Initializing browser for ${isProduction ? 'production' : 'development'} environment`);

      if (isProduction) {
        // Vercel production configuration using @sparticuz/chromium
        console.log('🔧 Setting up Chromium for Vercel...');
        
        const executablePath = await chromium.executablePath();
        
        this.browser = await puppeteer.launch({
          args: chromium.args,
          defaultViewport: chromium.defaultViewport,
          executablePath,
          headless: chromium.headless,
          ignoreHTTPSErrors: true,
        });
        
        console.log('✅ Chromium configured for production');
      } else {
        // Development configuration - use puppeteer (not puppeteer-core)
        const puppeteerDev = require('puppeteer');
        this.browser = await puppeteerDev.launch({
          headless: 'new',
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--window-size=1920,1080'
          ]
        });
        console.log('✅ Using local Chrome for development');
      }

      // Create new page
      if (!this.browser) {
        throw new Error('Browser failed to initialize');
      }

      this.page = await this.browser.newPage();

      // Configure page
      await this.page.setViewport({ width: 1920, height: 1080 });
      await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36');

      // Set timeouts
      await this.page.setDefaultNavigationTimeout(30000);
      await this.page.setDefaultTimeout(30000);

      // Test page readiness
      await this.page.evaluate(() => document.readyState);

      console.log('✅ Browser initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize browser:', error);
      await this.close();
      throw new Error(`Browser initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async scrapeBusinesses(params: SearchParams): Promise<BusinessData[]> {
    if (!this.page) {
      throw new Error('Scraper not initialized');
    }

    // Reset state for new scraping session
    this.scrapingState = 'running';
    this.scrapedBusinesses = [];
    this.currentBusinessIndex = 0;

    this.updateProgress({
      status: 'searching',
      currentStep: 'Searching for businesses...',
      progress: 0,
      totalFound: 0,
      scraped: 0,
      errors: []
    });
    
    // Convert categories array to search query  
    const categoryQuery = params.categories && params.categories.length > 0 
      ? params.categories.join(' OR ') 
      : 'business';
    
    const searchQuery = `${categoryQuery} near ${params.location}`;
    const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(searchQuery)}`;

    try {
      console.log('🔍 Navigating to:', searchUrl);
      await this.page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Check if cancelled during navigation
      if (this.isCancelled()) {
        return this.scrapedBusinesses;
      }

      // Wait for results to load - try multiple selectors
      const resultSelectors = [
        '[role="main"]',
        '.m6QErb',
        '[data-value="Directions"]',
        'a[href*="maps/place"]',
        '.hfpxzc'
      ];

      let resultsFound = false;
      for (const selector of resultSelectors) {
        if (this.isCancelled()) {
          return this.scrapedBusinesses;
        }
        
        try {
          await this.page.waitForSelector(selector, { timeout: 5000 });
          resultsFound = true;
          console.log(`✅ Found results with selector: ${selector}`);
          break;
        } catch (e) {
          console.log(`❌ Selector ${selector} not found, trying next...`);
        }
      }

      if (!resultsFound) {
        throw new Error('No search results found - page may have changed structure');
      }

      // Scroll to load more results and continuously find businesses
      await this.scrollAndLoadAllResults();

      // Check if cancelled during scrolling
      if (this.isCancelled()) {
        return this.scrapedBusinesses;
      }

      // Get all business links after scrolling - OPTIMIZED EXTRACTION
      let businessLinks: string[] = [];
      
      // Method 1: Look for directions links (most reliable) - OPTIMIZED
      try {
        businessLinks = await this.page.$$eval(
          'a[data-value="Directions"]',
          (links) => links.map(link => link.getAttribute('href')).filter(Boolean) as string[]
        );
        console.log(`📍 Method 1 found ${businessLinks.length} businesses`);
      } catch (e) {
        console.log('❌ Method 1 failed, trying method 2...');
      }

      // Method 2: Look for place links (comprehensive) - OPTIMIZED
      try {
        const method2Links = await this.page.$$eval(
          'a[href*="/maps/place/"]',
          (links) => links.map(link => link.getAttribute('href')).filter(Boolean) as string[]
        );
        
        // Combine and deduplicate
        const allLinks = Array.from(new Set([...businessLinks, ...method2Links]));
        businessLinks = allLinks;
        console.log(`📍 Method 2 found ${method2Links.length} additional businesses (total: ${businessLinks.length})`);
      } catch (e) {
        console.log('❌ Method 2 failed, trying method 3...');
      }

      // Method 3: Look for clickable business entries - OPTIMIZED
      try {
        const method3Links = await this.page.$$eval(
          '.hfpxzc[href*="/maps/place/"], [role="link"][href*="/maps/place/"]',
          (elements) => {
            return elements.map(el => {
              const href = el.getAttribute('href');
              if (href && href.includes('/maps/place/')) {
                return href;
              }
              return null;
            }).filter(Boolean) as string[];
          }
        );
        
        // Combine and deduplicate
        const allLinks = Array.from(new Set([...businessLinks, ...method3Links]));
        businessLinks = allLinks;
        console.log(`📍 Method 3 found ${method3Links.length} additional businesses (total: ${businessLinks.length})`);
      } catch (e) {
        console.log('❌ Method 3 failed');
      }

      // Final deduplication and validation - OPTIMIZED
      businessLinks = Array.from(new Set(businessLinks)).filter(link => 
        link && link.includes('/maps/place/') && link.length > 10
      );

      console.log(`🎯 Final business count: ${businessLinks.length} unique businesses found`);
      
      if (businessLinks.length === 0) {
        console.log('❌ No business links found. This might indicate:');
        console.log('   - The search returned no results');
        console.log('   - The page structure has changed');
        console.log('   - The page failed to load properly');
        console.log('   - Rate limiting or blocking occurred');
        
        // Return empty array instead of throwing error
        this.updateProgress({
          status: 'completed',
          currentStep: 'No businesses found',
          progress: 100,
          totalFound: 0,
          scraped: 0,
          errors: ['No business links found in search results']
        });
        
        return [];
      }

      this.businessLinks = businessLinks;
      this.totalBusinessesToScrape = Math.min(businessLinks.length, params.maxResults);

      this.updateProgress({
        status: 'scraping',
        currentStep: 'Extracting business information...',
        progress: 10,
        totalFound: businessLinks.length,
        scraped: 0,
        errors: []
      });

      // Check if page is still valid before proceeding
      try {
        await this.page.evaluate(() => document.readyState);
        console.log('✅ Page is still valid, proceeding with business scraping');
      } catch (e) {
        console.log('❌ Page context is invalid, cannot proceed with scraping');
        console.log('Error details:', e instanceof Error ? e.message : 'Unknown error');
        
        this.updateProgress({
          status: 'error',
          currentStep: 'Page context invalid',
          progress: 0,
          totalFound: businessLinks.length,
          scraped: 0,
          errors: ['Page context became invalid after scrolling. This may be due to page refresh or navigation.']
        });
        
        return [];
      }

      // Respect user's maxResults parameter, but allow up to 500 by default
      const userMaxResults = params.maxResults || 500;
      const envMaxResults = parseInt(process.env.MAX_BUSINESSES_PER_SEARCH || '500');
      const actualMaxResults = Math.min(userMaxResults, envMaxResults);
      
      const linksToProcess = businessLinks.slice(0, actualMaxResults);
      
      console.log(`🎯 Starting to scrape ${linksToProcess.length} businesses (found ${businessLinks.length} total, user limit: ${userMaxResults}, env limit: ${envMaxResults})`);
      
      // PARALLEL SCRAPING OPTIMIZATION
      const maxConcurrentScrapers = parseInt(process.env.MAX_CONCURRENT_SCRAPERS || '3');
      const batchSize = Math.min(maxConcurrentScrapers, 5); // Cap at 5 concurrent to avoid overwhelming Google
      
      console.log(`⚡ Using parallel scraping with ${batchSize} concurrent scrapers`);
      
      // Process businesses in batches for parallel scraping
      for (let batchStart = 0; batchStart < linksToProcess.length; batchStart += batchSize) {
        const batchEnd = Math.min(batchStart + batchSize, linksToProcess.length);
        const currentBatch = linksToProcess.slice(batchStart, batchEnd);
        
        console.log(`🔄 Processing batch ${Math.floor(batchStart/batchSize) + 1}/${Math.ceil(linksToProcess.length/batchSize)}: businesses ${batchStart + 1}-${batchEnd}`);
        
        // Check if cancelled or paused
        if (this.isCancelled()) {
          console.log('❌ Scraping cancelled by user');
          break;
        }

        if (this.isPaused()) {
          await this.waitForResume();
          if (this.isCancelled()) {
            console.log('❌ Scraping cancelled while paused');
            break;
          }
        }

        // Perform health check at start of each batch
        const healthOk = await this.ensureBrowserHealth();
        if (!healthOk) {
          console.log('❌ Browser health check failed, stopping scraping');
          break;
        }

        // Create multiple pages for parallel scraping
        const pages: Page[] = [];
        try {
          for (let i = 0; i < currentBatch.length; i++) {
            if (this.browser && this.browser.connected) {
              const newPage = await this.browser.newPage();
              await newPage.setViewport({ width: 1920, height: 1080 });
              await newPage.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36');
              await newPage.setDefaultNavigationTimeout(30000);
              await newPage.setDefaultTimeout(30000);
              pages.push(newPage);
            }
          }
        } catch (error) {
          console.error('❌ Error creating parallel pages:', error);
          // Fall back to sequential scraping
          pages.length = 0;
        }

        // Scrape businesses in parallel if we have multiple pages
        if (pages.length > 1) {
          const batchPromises = currentBatch.map(async (businessLink, index) => {
            const pageIndex = index % pages.length;
            const page = pages[pageIndex];
            const globalIndex = batchStart + index;
            
            try {
              const business = await this.scrapeBusinessDetailsParallel(businessLink, globalIndex + 1, linksToProcess.length, page);
              if (business) {
                console.log(`✅ Successfully scraped business ${globalIndex + 1}: ${business.name}`);
                return business;
              }
            } catch (error) {
              console.error(`❌ Error scraping business ${globalIndex + 1}:`, error);
            }
            return null;
          });

          const batchResults = await Promise.allSettled(batchPromises);
          
          // Process results
          batchResults.forEach((result, index) => {
            if (result.status === 'fulfilled' && result.value) {
              this.scrapedBusinesses.push(result.value);
            }
          });

          // Close parallel pages
          await Promise.all(pages.map(page => page.close().catch(() => {})));
          
        } else {
          // Fall back to sequential scraping
          for (let i = 0; i < currentBatch.length; i++) {
            const globalIndex = batchStart + i;
            this.currentBusinessIndex = globalIndex;

            try {
              const businessLink = currentBatch[i];
              if (businessLink) {
                // Reduced delay for faster processing
                if (i > 0) {
                  const baseDelay = parseInt(process.env.SCRAPING_DELAY_MIN || '1000');
                  const maxExtraDelay = parseInt(process.env.SCRAPING_DELAY_MAX || '2000');
                  const scaledDelay = Math.min(baseDelay + Math.floor(i / 10) * 200, 2000);
                  const delay = scaledDelay + Math.random() * maxExtraDelay;
                  
                  // Reduce delay in conservative mode to prevent timeouts
                  const finalDelay = process.env.CONSERVATIVE_SCRAPING === 'true' 
                    ? Math.min(delay, 1500) // Cap at 1.5 seconds in conservative mode
                    : delay;
                  
                  console.log(`⏳ Waiting ${Math.round(finalDelay)}ms before scraping business ${globalIndex + 1}/${linksToProcess.length}`);
                  await new Promise(resolve => setTimeout(resolve, finalDelay));
                }
                
                const business = await this.scrapeBusinessDetails(businessLink, globalIndex + 1, linksToProcess.length);
                if (business) {
                  this.scrapedBusinesses.push(business);
                  console.log(`✅ Successfully scraped business ${globalIndex + 1}: ${business.name}`);
                } else {
                  console.log(`❌ Failed to scrape business ${globalIndex + 1}`);
                }
              }
            } catch (error) {
              console.error(`❌ Error scraping business ${globalIndex + 1}:`, error);
            }
            
            // Update progress more frequently
            const progressPercent = 10 + (globalIndex / linksToProcess.length) * 85;
            this.updateProgress({
              status: this.isPaused() ? 'paused' : 'scraping',
              currentStep: this.isPaused() 
                ? 'Scraping paused by user' 
                : `Scraped ${this.scrapedBusinesses.length}/${linksToProcess.length} businesses`,
              progress: progressPercent,
              totalFound: linksToProcess.length,
              scraped: this.scrapedBusinesses.length,
              errors: []
            });
          }
        }
        
        // Brief pause between batches to be respectful
        if (batchEnd < linksToProcess.length) {
          console.log(`📊 Batch completed: ${this.scrapedBusinesses.length}/${linksToProcess.length} businesses scraped`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // Set final state
      if (this.isCancelled()) {
        this.updateProgress({
          status: 'cancelled',
          currentStep: 'Scraping cancelled by user',
          progress: Math.round((this.currentBusinessIndex / linksToProcess.length) * 100),
          totalFound: linksToProcess.length,
          scraped: this.scrapedBusinesses.length,
          errors: []
        });
      } else {
        this.scrapingState = 'completed';
        this.updateProgress({
          status: 'completed',
          currentStep: 'Scraping completed!',
          progress: 100,
          totalFound: linksToProcess.length,
          scraped: this.scrapedBusinesses.length,
          errors: []
        });
      }

      return this.scrapedBusinesses;
    } catch (error) {
      console.error('❌ Error during scraping:', error);
      throw error;
    }
  }

  private async scrollAndLoadAllResults(): Promise<void> {
    if (!this.page) return;

    console.log('🔄 Starting optimized scrolling to load ALL businesses...');
    
    // Reduced timeout for faster operation
    const scrollTimeout = setTimeout(() => {
      console.log('⏰ Scroll timeout reached, stopping scroll process');
      return;
    }, 180000); // Reduced from 5 minutes to 3 minutes
    
    try {
    // Optimized scroll containers - prioritize most common ones
    const scrollContainers = [
      '[role="main"]',
      '.m6QErb',
      'div[role="feed"]',
      '.DxyBCb',
      '.hfpxzc',
      '.section-layout'
    ];

    let scrollContainer = null;
    for (const selector of scrollContainers) {
        try {
      scrollContainer = await this.page.$(selector);
      if (scrollContainer) {
        console.log(`✅ Found scroll container: ${selector}`);
        break;
          }
        } catch (e) {
          // Continue to next selector
      }
    }

    if (!scrollContainer) {
      console.log('❌ Could not find scroll container, trying alternative approach...');
        try {
      scrollContainer = await this.page.$('body');
        } catch (e) {
          console.log('❌ Could not find body element, proceeding without scroll container');
        }
    }

    let scrollAttempts = 0;
    let maxScrollAttempts = 30; // Reduced from 50 to 30 for faster operation
    let consecutiveNoChange = 0;
    let previousBusinessCount = 0;
    let maxConsecutiveNoChange = 6; // Reduced from 8 to 6 for faster termination
    let lastBusinessCount = 0;
      
      // Add conservative mode to prevent aggressive scrolling
      const conservativeMode = process.env.CONSERVATIVE_SCRAPING === 'true';
      if (conservativeMode) {
        maxScrollAttempts = 15; // More conservative limit
        maxConsecutiveNoChange = 3; // Stop earlier in conservative mode
        console.log('🛡️ Conservative scraping mode enabled - will stop earlier to prevent errors');
      }
    
    while (scrollAttempts < maxScrollAttempts && consecutiveNoChange < maxConsecutiveNoChange) {
      scrollAttempts++;
        
        // Check if scraping was cancelled or paused
        if (this.isCancelled()) {
          console.log('❌ Scraping cancelled during scrolling');
          return;
        }
        
        if (this.isPaused()) {
          console.log('⏸️ Scraping paused during scrolling');
          await this.waitForResume();
        }
      
      // Get current business count using optimized method
        let currentBusinessCount = 0;
        try {
          currentBusinessCount = await this.page.$$eval(
        'a[href*="/maps/place/"], a[data-value="Directions"]',
        (elements) => elements.length
          );
        } catch (e) {
          console.log('⚠️ Error getting business count, using 0');
          currentBusinessCount = 0;
        }

      console.log(`📊 Scroll attempt ${scrollAttempts}: Found ${currentBusinessCount} businesses`);

      // Optimized scrolling - multiple strategies simultaneously
      const scrollPromises = [];

      // Method 1: Scroll the container
      if (scrollContainer) {
          scrollPromises.push(
            this.page.evaluate((container) => {
              container.scrollTo(0, container.scrollHeight);
            }, scrollContainer).catch(() => {})
          );
      }

      // Method 2: Scroll the entire page
      scrollPromises.push(
        this.page.evaluate(() => {
          window.scrollTo(0, document.body.scrollHeight);
        }).catch(() => {})
      );

      // Method 3: Try to scroll specific elements
      scrollPromises.push(
        this.page.evaluate(() => {
          const elements = document.querySelectorAll('[role="main"], .m6QErb, .DxyBCb');
          elements.forEach(el => {
            if (el.scrollHeight > el.clientHeight) {
              el.scrollTo(0, el.scrollHeight);
            }
          });
        }).catch(() => {})
      );

      // Execute all scroll operations simultaneously
      await Promise.all(scrollPromises);

      // Reduced wait time for content to load
      await new Promise(resolve => setTimeout(resolve, 1000)); // Reduced from 2000ms to 1000ms

      // Optimized content loading strategies
      let contentLoaded = false;

      // Strategy 1: Click "Show more results" buttons with optimized selectors
      const showMoreSelectors = [
        'button[jsaction*="more"]',
        '.OKXSBb',
        '[data-value="Show more results"]',
        '[aria-label*="Show more"]',
        'button[aria-label*="more"]',
        '.VfPpkd-LgbsSe',
        'button[jsaction*="pane.scroll"]'
      ];

      for (const selector of showMoreSelectors) {
        try {
          const buttons = await this.page.$$(selector);
          for (const button of buttons) {
              try {
            const isVisible = await button.isVisible();
            if (isVisible) {
              console.log(`🔘 Clicking button with selector: ${selector}`);
              await button.click();
              await new Promise(resolve => setTimeout(resolve, 1000)); // Reduced from 2000ms to 1000ms
              contentLoaded = true;
              break;
                }
              } catch (e) {
                // Continue to next button
            }
          }
          if (contentLoaded) break;
        } catch (e) {
          // Continue to next selector
        }
      }

      // Strategy 2: Click by text content (optimized)
      if (!contentLoaded) {
        try {
          const buttons = await this.page.$$('button, [role="button"]');
          for (const button of buttons.slice(0, 10)) { // Limit to first 10 buttons for speed
              try {
            const text = await button.evaluate(el => el.textContent?.toLowerCase() || '');
            if (text.includes('show more') || text.includes('more results') || text.includes('load more')) {
              const isVisible = await button.isVisible();
              if (isVisible) {
                console.log(`🔘 Clicking button with text: "${text}"`);
                await button.click();
                await new Promise(resolve => setTimeout(resolve, 1000));
                contentLoaded = true;
                break;
              }
                }
              } catch (e) {
                // Continue to next button
            }
          }
        } catch (e) {
          // Continue
        }
      }

      // Strategy 3: Try to expand business cards (optimized)
      if (!contentLoaded) {
        try {
          const expandButtons = await this.page.$$('[aria-label*="expand"], [aria-label*="more"]');
          for (const button of expandButtons.slice(0, 5)) { // Limit to first 5 for speed
              try {
            const isVisible = await button.isVisible();
            if (isVisible) {
              console.log(`🔘 Clicking expand button`);
              await button.click();
              await new Promise(resolve => setTimeout(resolve, 500)); // Reduced wait time
                }
              } catch (e) {
                // Continue to next button
            }
          }
        } catch (e) {
          // Continue
        }
      }

      // Strategy 4: Optimized scroll to business elements
        try {
      await this.page.evaluate(() => {
        const businessElements = document.querySelectorAll('a[href*="/maps/place/"]');
        if (businessElements.length > 0) {
          const lastElement = businessElements[businessElements.length - 1];
          lastElement.scrollIntoView({ behavior: 'auto', block: 'end' }); // Changed from 'smooth' to 'auto' for speed
        }
      });
        } catch (e) {
          console.log('⚠️ Error scrolling to business elements');
        }

      // Reduced wait time after scrolling
      await new Promise(resolve => setTimeout(resolve, 1000)); // Reduced from 2000ms to 1000ms

      // Check if we found new businesses
        let newBusinessCount = 0;
        try {
          newBusinessCount = await this.page.$$eval(
        'a[href*="/maps/place/"], a[data-value="Directions"]',
        (elements) => elements.length
          );
        } catch (e) {
          console.log('⚠️ Error getting new business count');
          newBusinessCount = currentBusinessCount;
        }

      if (newBusinessCount > currentBusinessCount) {
        const newBusinessesFound = newBusinessCount - currentBusinessCount;
        console.log(`✅ Found ${newBusinessesFound} NEW businesses! (Total: ${newBusinessCount}, Previous: ${currentBusinessCount})`);
        consecutiveNoChange = 0;
        previousBusinessCount = newBusinessCount;
        lastBusinessCount = newBusinessCount;
      } else if (newBusinessCount === currentBusinessCount && currentBusinessCount > 0) {
        consecutiveNoChange++;
        console.log(`⏳ No NEW businesses found (${consecutiveNoChange}/${maxConsecutiveNoChange} attempts) - Total businesses: ${newBusinessCount}`);
        
        // Optimized alternative loading strategies
        if (consecutiveNoChange > 2) { // Reduced from 3 to 2
          console.log('🔄 Trying alternative loading strategies...');
          
          // Optimized alternative strategies
            try {
          await this.page.evaluate(() => {
            // Quick scroll to middle then bottom
            window.scrollTo(0, document.body.scrollHeight / 2);
            setTimeout(() => {
              window.scrollTo(0, document.body.scrollHeight);
            }, 500); // Reduced from 1000ms to 500ms
          });
          
          await new Promise(resolve => setTimeout(resolve, 1500)); // Reduced from 3000ms to 1500ms
          
          // Quick click on visible interactive elements
          try {
            const interactiveElements = await this.page.$$('[role="button"], button');
            for (const element of interactiveElements.slice(0, 3)) { // Reduced from 5 to 3
                  try {
              const isVisible = await element.isVisible();
              if (isVisible) {
                await element.click();
                await new Promise(resolve => setTimeout(resolve, 300)); // Reduced from 500ms to 300ms
                    }
                  } catch (e) {
                    // Continue to next element
              }
            }
          } catch (e) {
            // Continue
              }
            } catch (e) {
              console.log('⚠️ Error in alternative loading strategies');
          }
        }
      } else {
        // Business count decreased or is 0
        console.log(`⚠️ Business count changed from ${currentBusinessCount} to ${newBusinessCount}`);
        consecutiveNoChange++;
      }

        // Optimized termination condition
      if (consecutiveNoChange >= 4 && lastBusinessCount > 0) { // Reduced from 5 to 4
          console.log('🔄 No more businesses found after multiple attempts. Stopping scroll process gracefully.');
          console.log(`✅ Successfully loaded ${lastBusinessCount} businesses. Moving to data extraction phase.`);
          break;
      }
    }

    console.log(`🏁 Scrolling completed after ${scrollAttempts} attempts. Final business count: ${lastBusinessCount || previousBusinessCount}`);
    } finally {
      clearTimeout(scrollTimeout);
    }
  }

  private async scrapeBusinessDetails(url: string, currentBusinessIndex: number = 0, totalBusinesses: number = 0): Promise<BusinessData | null> {
    if (!this.page || !this.browser) {
      console.error('❌ Browser or page not available');
      return null;
    }

    let retries = 3;
    while (retries > 0) {
      try {
        // Check if browser is still connected and reinitialize if needed
        if (!this.browser.connected) {
          console.error('❌ Browser disconnected, reinitializing...');
          await this.initialize();
          if (!this.page) {
            console.error('❌ Failed to reinitialize browser');
            return null;
          }
        }

        // Check if page is still valid
        try {
          await this.page.evaluate(() => document.readyState);
        } catch (e) {
          console.log('⚠️ Page context invalid, creating new page...');
          if (this.browser && this.browser.connected) {
            this.page = await this.browser.newPage();
            await this.page.setViewport({ width: 1920, height: 1080 });
            await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36');
            await this.page.setDefaultNavigationTimeout(30000);
            await this.page.setDefaultTimeout(30000);
          } else {
            console.error('❌ Browser not available for page recreation');
            return null;
          }
        }

        // Navigate with increased timeout for better reliability
        console.log(`🔍 Scraping business ${currentBusinessIndex}/${totalBusinesses}: ${url.substring(0, 100)}...`);
        
        await this.page.goto(url, { 
          waitUntil: 'networkidle2', 
          timeout: 45000  // Increased from 20s to 45s
        });
        
        // Wait for page to be ready - increased wait time
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Check for common Google Maps error pages
        const pageTitle = await this.page.title().catch(() => '');
        const pageUrl = this.page.url();
        
        if (!pageTitle || 
            pageTitle.includes('Error') || 
            pageTitle.includes('404') ||
            pageUrl.includes('sorry') ||
            pageUrl.includes('blocked')) {
          console.warn(`⚠️ Invalid or blocked page for business ${currentBusinessIndex}: ${pageTitle}`);
          
          // If blocked, wait longer before retrying
          if (pageUrl.includes('blocked') || pageUrl.includes('sorry')) {
            console.log(`🚫 Detected blocking, waiting 10 seconds before retry...`);
            await new Promise(resolve => setTimeout(resolve, 10000));
          }
          
          retries--;
          if (retries === 0) {
            console.error(`❌ Failed to load business page after all retries: ${currentBusinessIndex}`);
            return null;
          }
          continue;
        }

        // Try to detect if the page has loaded properly by checking for business content
        try {
          await this.page.waitForSelector('h1, [data-attrid="title"], .DUwDvf', { timeout: 10000 });
        } catch (selectorTimeout) {
          console.warn(`⚠️ Business content not found for ${currentBusinessIndex}, might be empty page`);
          retries--;
          if (retries === 0) return null;
          await new Promise(resolve => setTimeout(resolve, 2000));
          continue;
        }

        const businessData = await this.page.evaluate(() => {
          const getName = (): string => {
            const selectors = [
              'h1[data-attrid="title"]',
              '[data-attrid="title"] span',
              'h1.DUwDvf',
              'h1.x3AX1-LfntMc-header-title-title',
              'h1',
              '.DUwDvf',
              '.SPZz6b h1'
            ];
            
            for (const selector of selectors) {
              const element = document.querySelector(selector);
              if (element?.textContent?.trim()) {
                return element.textContent.trim();
              }
            }
            return '';
          };

          const getAddress = (): string => {
            const selectors = [
              '[data-item-id="address"] .Io6YTe',
              '[data-attrid="kc:/location/location:address"]',
              '.LrzXr',
              '[data-value="Address"]',
              '.rogA2c .Io6YTe',
              '.lI9IFe'
            ];
            
            for (const selector of selectors) {
              const element = document.querySelector(selector);
              if (element?.textContent?.trim()) {
                return element.textContent.trim();
              }
            }
            return '';
          };

          const getPhone = (): string => {
            const selectors = [
              '[data-item-id*="phone"] .Io6YTe',
              '[data-attrid*="phone"]',
              'span[dir="ltr"]',
              '[data-value="Phone"]',
              '.rogA2c [data-item-id*="phone"]',
              'a[href^="tel:"]'
            ];
            
            for (const selector of selectors) {
              const element = document.querySelector(selector);
              if (element?.textContent?.trim()) {
                const phone = element.textContent.trim();
                // Validate phone number format
                if (/[\d\+\-\(\)\s]{7,}/.test(phone)) {
                  return phone;
                }
              }
            }
            return '';
          };

          const getWebsite = (): string => {
            const selectors = [
              'a[data-item-id*="authority"]',
              'a[data-attrid*="website"]',
              'a[href^="http"]:not([href*="google.com"])',
              '[data-value="Website"] a'
            ];
            
            for (const selector of selectors) {
              const element = document.querySelector(selector) as HTMLAnchorElement;
              if (element?.href && !element.href.includes('google.com')) {
                return element.href;
              }
            }
            return '';
          };

          const getRating = (): number => {
            const selectors = [
              '[data-attrid="review-score"] span',
              '.lTi8oc',
              '[aria-label*="stars"]',
              '.fontDisplayLarge'
            ];
            
            for (const selector of selectors) {
              const element = document.querySelector(selector);
              if (element?.textContent) {
                const ratingText = element.textContent.trim();
                const rating = parseFloat(ratingText);
                if (!isNaN(rating) && rating >= 0 && rating <= 5) {
                  return rating;
                }
              }
            }
            return 0;
          };

          const getReviewCount = (): number => {
            const selectors = [
              '[data-attrid="review-score"] + span',
              '.lTi8oc + span',
              '[aria-label*="reviews"]'
            ];
            
            for (const selector of selectors) {
              const element = document.querySelector(selector);
              if (element?.textContent) {
                const reviewText = element.textContent.trim();
                const match = reviewText.match(/(\d+(?:,\d+)*)/);
                if (match) {
                  return parseInt(match[1].replace(/,/g, ''));
                }
              }
            }
            return 0;
          };

          const getCategory = (): string => {
            const selectors = [
              '[data-attrid="kc:/local:place_type"]',
              '.rogA2c .Io6YTe',
              '[data-value="Category"]',
              '.lI9IFe'
            ];
            
            for (const selector of selectors) {
              const element = document.querySelector(selector);
              if (element?.textContent?.trim()) {
                return element.textContent.trim();
              }
            }
            return '';
          };

          const getHours = (): string => {
            const selectors = [
              '[data-item-id*="hours"]',
              '[data-attrid*="hours"]',
              '[data-value="Hours"]',
              '.rogA2c [data-item-id*="hours"]'
            ];
            
            for (const selector of selectors) {
              const element = document.querySelector(selector);
              if (element?.textContent?.trim()) {
                return element.textContent.trim();
              }
            }
            return '';
          };

          return {
            name: getName(),
            address: getAddress(),
            phone: getPhone(),
            website: getWebsite(),
            rating: getRating(),
            reviewCount: getReviewCount(),
            category: getCategory(),
            hours: getHours()
          };
        });

        // Extract coordinates from URL
        const coordinates = this.extractCoordinatesFromUrl(url);

        if (coordinates) {
          console.log(`✅ Extracted coordinates from URL: ${coordinates.lat}, ${coordinates.lng}`);
        }

        // Create business data object
        const business: BusinessData = {
          id: `business_${Date.now()}_${currentBusinessIndex}`,
          name: businessData.name || 'Unknown Business',
          address: businessData.address || 'Address not available',
          phone: businessData.phone || undefined,
          website: businessData.website || undefined,
          rating: businessData.rating > 0 ? businessData.rating : undefined,
          reviewCount: businessData.reviewCount > 0 ? businessData.reviewCount : undefined,
          category: businessData.category || undefined,
          hours: businessData.hours || undefined,
          coordinates: coordinates,
          scrapedAt: new Date()
        };

        console.log(`✅ Successfully extracted data for business ${currentBusinessIndex}: ${business.name}`);
        return business;

      } catch (error) {
        console.error(`❌ Error scraping business ${currentBusinessIndex}:`, error);
        
        // Check if it's a browser disconnection error
        if (error instanceof Error && (
          error.message.includes('frame was detached') ||
          error.message.includes('Target closed') ||
          error.message.includes('Session closed')
        )) {
          console.log('🔄 Browser disconnected, attempting to reinitialize...');
          try {
            await this.initialize();
            if (!this.page) {
              console.error('❌ Failed to reinitialize browser after disconnection');
              return null;
            }
            console.log('✅ Browser reinitialized successfully');
          } catch (reinitError) {
            console.error('❌ Failed to reinitialize browser:', reinitError);
            return null;
          }
        }
        
        retries--;
        
        if (retries === 0) {
          console.error(`❌ Failed to scrape business ${currentBusinessIndex} after all retries`);
          return null;
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    return null;
  }

  private async scrapeBusinessDetailsParallel(url: string, currentBusinessIndex: number = 0, totalBusinesses: number = 0, page: Page): Promise<BusinessData | null> {
    if (!page) {
      console.error('❌ Page not available for parallel scraping');
      return null;
    }

    let retries = 2; // Reduced retries for parallel scraping
    while (retries > 0) {
      try {
        // Check if page is still valid
        try {
          await page.evaluate(() => document.readyState);
        } catch (e) {
          console.log('⚠️ Page context invalid, creating new page...');
          if (this.browser && this.browser.connected) {
            page = await this.browser.newPage();
            await page.setViewport({ width: 1920, height: 1080 });
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36');
            await page.setDefaultNavigationTimeout(30000);
            await page.setDefaultTimeout(30000);
          } else {
            console.error('❌ Browser not available for page recreation');
            return null;
          }
        }

        // Navigate with optimized timeout for parallel scraping
        console.log(`🔍 [PARALLEL] Scraping business ${currentBusinessIndex}/${totalBusinesses}: ${url.substring(0, 80)}...`);
        
        await page.goto(url, { 
          waitUntil: 'domcontentloaded', // Faster than networkidle2
          timeout: 30000  // Reduced timeout for parallel scraping
        });
        
        // Reduced wait time for parallel scraping
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Check for common Google Maps error pages
        const pageTitle = await page.title().catch(() => '');
        const pageUrl = page.url();
        
        if (!pageTitle || 
            pageTitle.includes('Error') || 
            pageTitle.includes('404') ||
            pageUrl.includes('sorry') ||
            pageUrl.includes('blocked')) {
          console.warn(`⚠️ [PARALLEL] Invalid page for business ${currentBusinessIndex}: ${pageTitle}`);
          retries--;
          if (retries === 0) return null;
          continue;
        }

        // Try to detect if the page has loaded properly
        try {
          await page.waitForSelector('h1, [data-attrid="title"], .DUwDvf', { timeout: 8000 });
        } catch (selectorTimeout) {
          console.warn(`⚠️ [PARALLEL] Business content not found for ${currentBusinessIndex}`);
          retries--;
          if (retries === 0) return null;
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }

        const businessData = await page.evaluate(() => {
          const getName = (): string => {
            const selectors = [
              'h1[data-attrid="title"]',
              '[data-attrid="title"] span',
              'h1.DUwDvf',
              'h1.x3AX1-LfntMc-header-title-title',
              'h1',
              '.DUwDvf',
              '.SPZz6b h1'
            ];
            
            for (const selector of selectors) {
              const element = document.querySelector(selector);
              if (element?.textContent?.trim()) {
                return element.textContent.trim();
              }
            }
            return '';
          };

          const getAddress = (): string => {
            const selectors = [
              '[data-item-id="address"] .Io6YTe',
              '[data-attrid="kc:/location/location:address"]',
              '.LrzXr',
              '[data-value="Address"]',
              '.rogA2c .Io6YTe',
              '.lI9IFe'
            ];
            
            for (const selector of selectors) {
              const element = document.querySelector(selector);
              if (element?.textContent?.trim()) {
                return element.textContent.trim();
              }
            }
            return '';
          };

          const getPhone = (): string => {
            const selectors = [
              '[data-item-id*="phone"] .Io6YTe',
              '[data-attrid*="phone"]',
              'span[dir="ltr"]',
              '[data-value="Phone"]',
              '.rogA2c [data-item-id*="phone"]',
              'a[href^="tel:"]'
            ];
            
            for (const selector of selectors) {
              const element = document.querySelector(selector);
              if (element?.textContent?.trim()) {
                const phone = element.textContent.trim();
                if (/[\d\+\-\(\)\s]{7,}/.test(phone)) {
                  return phone;
                }
              }
            }
            return '';
          };

          const getWebsite = (): string => {
            const selectors = [
              'a[data-item-id*="authority"]',
              'a[data-attrid*="website"]',
              'a[href^="http"]:not([href*="google.com"])',
              '[data-value="Website"] a'
            ];
            
            for (const selector of selectors) {
              const element = document.querySelector(selector) as HTMLAnchorElement;
              if (element?.href && !element.href.includes('google.com')) {
                return element.href;
              }
            }
            return '';
          };

          const getRating = (): number => {
            const selectors = [
              '[data-attrid="review-score"] span',
              '.lTi8oc',
              '[aria-label*="stars"]',
              '.fontDisplayLarge'
            ];
            
            for (const selector of selectors) {
              const element = document.querySelector(selector);
              if (element?.textContent) {
                const ratingText = element.textContent.trim();
                const rating = parseFloat(ratingText);
                if (!isNaN(rating) && rating >= 0 && rating <= 5) {
                  return rating;
                }
              }
            }
            return 0;
          };

          const getReviewCount = (): number => {
            const selectors = [
              '[data-attrid="review-score"] + span',
              '.lTi8oc + span',
              '[aria-label*="reviews"]'
            ];
            
            for (const selector of selectors) {
              const element = document.querySelector(selector);
              if (element?.textContent) {
                const reviewText = element.textContent.trim();
                const match = reviewText.match(/(\d+(?:,\d+)*)/);
                if (match) {
                  return parseInt(match[1].replace(/,/g, ''));
                }
              }
            }
            return 0;
          };

          const getCategory = (): string => {
            const selectors = [
              '[data-attrid="kc:/local:place_type"]',
              '.rogA2c .Io6YTe',
              '[data-value="Category"]',
              '.lI9IFe'
            ];
            
            for (const selector of selectors) {
              const element = document.querySelector(selector);
              if (element?.textContent?.trim()) {
                return element.textContent.trim();
              }
            }
            return '';
          };

          const getHours = (): string => {
            const selectors = [
              '[data-item-id*="hours"]',
              '[data-attrid*="hours"]',
              '[data-value="Hours"]',
              '.rogA2c [data-item-id*="hours"]'
            ];
            
            for (const selector of selectors) {
              const element = document.querySelector(selector);
              if (element?.textContent?.trim()) {
                return element.textContent.trim();
              }
            }
            return '';
          };

          return {
            name: getName(),
            address: getAddress(),
            phone: getPhone(),
            website: getWebsite(),
            rating: getRating(),
            reviewCount: getReviewCount(),
            category: getCategory(),
            hours: getHours()
          };
        });

        // Extract coordinates from URL
        const coordinates = this.extractCoordinatesFromUrl(url);

        // Create business data object
        const business: BusinessData = {
          id: `business_${Date.now()}_${currentBusinessIndex}`,
          name: businessData.name || 'Unknown Business',
          address: businessData.address || 'Address not available',
          phone: businessData.phone || undefined,
          website: businessData.website || undefined,
          rating: businessData.rating > 0 ? businessData.rating : undefined,
          reviewCount: businessData.reviewCount > 0 ? businessData.reviewCount : undefined,
          category: businessData.category || undefined,
          hours: businessData.hours || undefined,
          coordinates: coordinates,
          scrapedAt: new Date()
        };

        console.log(`✅ [PARALLEL] Successfully scraped business ${currentBusinessIndex}: ${business.name}`);
        return business;

      } catch (error) {
        console.error(`❌ [PARALLEL] Error scraping business ${currentBusinessIndex}:`, error);
        retries--;
        
        if (retries === 0) {
          console.error(`❌ [PARALLEL] Failed to scrape business ${currentBusinessIndex} after all retries`);
          return null;
        }
        
        // Shorter wait before retrying for parallel scraping
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return null;
  }

  private extractCoordinatesFromUrl(url: string): { lat: number; lng: number } | undefined {
    try {
      // Try to extract coordinates from URL parameters
      const urlObj = new URL(url);
      const dataParam = urlObj.searchParams.get('data');
      
      if (dataParam) {
        // Look for coordinates in the data parameter
        const coordMatch = dataParam.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
        if (coordMatch) {
          const lat = parseFloat(coordMatch[1]);
          const lng = parseFloat(coordMatch[2]);
          return { lat, lng };
        }
      }
      
      // Try alternative URL patterns
      const coordPattern = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
      const match = url.match(coordPattern);
      if (match) {
        const lat = parseFloat(match[1]);
        const lng = parseFloat(match[2]);
          return { lat, lng };
    }
    
      return undefined;
    } catch (error) {
      console.error('❌ Error extracting coordinates from URL:', error);
    return undefined;
    }
  }

  private updateProgress(progress: ScrapingProgress): void {
    if (this.progressCallback) {
      this.progressCallback(progress);
    }
  }

  async close(): Promise<void> {
    try {
      if (this.page) {
        await this.page.close().catch(() => {});
        this.page = null;
      }
      if (this.browser) {
        await this.browser.close().catch(() => {});
        this.browser = null;
      }
      console.log('✅ Browser cleanup completed');
    } catch (error) {
      console.error('❌ Error closing browser:', error);
    }
  }
} 