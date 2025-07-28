const {join} = require('path');

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // Changes the cache location for Puppeteer.
  cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
  // Skip downloading Chrome for serverless environments
  skipChromiumDownload: process.env.NODE_ENV === 'production',
};
