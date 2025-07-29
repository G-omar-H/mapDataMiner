// Global scraper instance store (in production, use Redis or database)
let globalScraperInstance: any = null;

export function setGlobalScraperInstance(instance: any) {
  globalScraperInstance = instance;
}

export function getGlobalScraperInstance() {
  return globalScraperInstance;
}

export function clearGlobalScraperInstance() {
  globalScraperInstance = null;
} 