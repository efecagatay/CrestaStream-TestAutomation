import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * CrestaStream Test Automation Configuration
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // Test dosyalarının bulunduğu dizin
  testDir: './tests',
  
  // Test dosyası pattern'i
  testMatch: '**/*.spec.ts',
  
  // Her test için maksimum süre (ms)
  timeout: 60_000,
  
  // Expect timeout
  expect: {
    timeout: 10_000,
    toHaveScreenshot: {
      maxDiffPixels: 100,
      threshold: 0.2,
    },
  },
  
  // Tüm testler için tekrar deneme sayısı
  retries: process.env.CI ? 2 : 0,
  
  // Paralel worker sayısı
  workers: process.env.CI ? 2 : 4,
  
  // Test sırası - fully-parallel: her test bağımsız çalışır
  fullyParallel: true,
  
  // CI'da build fail olsun mu?
  forbidOnly: !!process.env.CI,
  
  // Reporter yapılandırması
  reporter: [
    ['list'],
    ['html', { 
      outputFolder: 'playwright-report',
      open: process.env.CI ? 'never' : 'on-failure'
    }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],
  
  // Tüm testler için ortak ayarlar
  use: {
    // Base URL for navigation
    baseURL: process.env.BASE_URL || 'https://demo.crestastream.app',
    
    // Trace collection
    trace: 'on-first-retry',
    
    // Screenshot on failure
    screenshot: 'only-on-failure',
    
    // Video recording
    video: 'retain-on-failure',
    
    // Viewport size
    viewport: { width: 1920, height: 1080 },
    
    // Ignore HTTPS errors
    ignoreHTTPSErrors: true,
    
    // Action timeout
    actionTimeout: 15_000,
    
    // Navigation timeout
    navigationTimeout: 30_000,
    
    // Extra HTTP headers
    extraHTTPHeaders: {
      'Accept-Language': 'en-US,en;q=0.9',
    },
  },

  // Test artifacts output directory
  outputDir: 'test-results/',

  // Project-based browser configurations
  projects: [
    // Desktop Browsers
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        channel: 'chrome',
      },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    
    // Mobile Browsers
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 13'] },
    },
    
    // API Tests (browserless)
    {
      name: 'api',
      testDir: './tests/api',
      use: {
        baseURL: process.env.API_URL || 'https://api.crestastream.app',
      },
    },
    
    // Visual Regression Tests
    {
      name: 'visual',
      testDir: './tests/visual',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
    },
  ],

  // Web server configuration (optional - for local development)
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  //   timeout: 120_000,
  // },
});
