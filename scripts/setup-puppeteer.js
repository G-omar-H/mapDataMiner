const fs = require('fs');
const path = require('path');

// Setup Puppeteer for serverless environments
console.log('🚀 Setting up Puppeteer for production deployment...');

// Create .puppeteerrc.cjs if it doesn't exist
const puppeteerConfig = `const {join} = require('path');

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // Changes the cache location for Puppeteer.
  cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
  // Skip downloading Chrome for serverless environments
  skipChromiumDownload: process.env.NODE_ENV === 'production',
};
`;

const configPath = path.join(process.cwd(), '.puppeteerrc.cjs');
if (!fs.existsSync(configPath)) {
  fs.writeFileSync(configPath, puppeteerConfig);
  console.log('✅ Created .puppeteerrc.cjs configuration');
}

// Create cache directory
const cacheDir = path.join(process.cwd(), '.cache', 'puppeteer');
if (!fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir, { recursive: true });
  console.log('✅ Created Puppeteer cache directory');
}

console.log('✅ Puppeteer setup completed for serverless deployment'); 