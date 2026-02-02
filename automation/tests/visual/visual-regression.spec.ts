import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/login.page';
import { AnalyticsPage } from '../../pages/analytics.page';
import { Logger } from '../../utils/logger';
import testData from '../../fixtures/test-data.json';

/**
 * Visual Regression Test Suite
 * Tests the visual consistency of UI components
 */
test.describe('Visual Regression Tests', () => {
  let loginPage: LoginPage;
  let analyticsPage: AnalyticsPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    analyticsPage = new AnalyticsPage(page);
  });

  test.afterEach(async ({ }, testInfo) => {
    Logger.endTest(
      testInfo.title,
      testInfo.status === 'passed' ? 'PASSED' : 
      testInfo.status === 'failed' ? 'FAILED' : 'SKIPPED'
    );
  });

  test.describe('Login Page Visual Tests', () => {
    test('should match login page screenshot', async ({ page }) => {
      Logger.startTest('Login Page Visual');

      await loginPage.navigate();
      await loginPage.verifyPageLoaded();

      await expect(page).toHaveScreenshot('login-page.png', {
        fullPage: true,
        animations: 'disabled',
        mask: [
          // Mask dynamic content
          page.locator('[data-testid="timestamp"]'),
        ],
      });
    });

    test('should match login form screenshot', async ({ page }) => {
      Logger.startTest('Login Form Visual');

      await loginPage.navigate();

      const form = page.locator('form');
      await expect(form).toHaveScreenshot('login-form.png', {
        animations: 'disabled',
      });
    });

    test('should match login error state screenshot', async ({ page }) => {
      Logger.startTest('Login Error Visual');

      await loginPage.navigate();
      await loginPage.attemptInvalidLogin('wrong@email.com', 'wrongpass');

      await expect(page).toHaveScreenshot('login-error.png', {
        fullPage: true,
        animations: 'disabled',
      });
    });

    test('should match login page on mobile', async ({ page }) => {
      Logger.startTest('Login Page Mobile Visual');

      await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
      await loginPage.navigate();

      await expect(page).toHaveScreenshot('login-page-mobile.png', {
        fullPage: true,
        animations: 'disabled',
      });
    });

    test('should match login page on tablet', async ({ page }) => {
      Logger.startTest('Login Page Tablet Visual');

      await page.setViewportSize({ width: 768, height: 1024 }); // iPad
      await loginPage.navigate();

      await expect(page).toHaveScreenshot('login-page-tablet.png', {
        fullPage: true,
        animations: 'disabled',
      });
    });
  });

  test.describe('Dashboard Visual Tests', () => {
    test.beforeEach(async () => {
      await loginPage.navigate();
      await loginPage.login(testData.users.admin.email, testData.users.admin.password);
    });

    test('should match dashboard page screenshot', async ({ page }) => {
      Logger.startTest('Dashboard Page Visual');

      await analyticsPage.navigateAndWaitForData();

      await expect(page).toHaveScreenshot('dashboard-page.png', {
        fullPage: true,
        animations: 'disabled',
        mask: [
          // Mask dynamic data
          page.locator('[data-testid="metric-value"]'),
          page.locator('[data-testid="last-updated"]'),
          page.locator('[data-testid="live-indicator"]'),
        ],
      });
    });

    test('should match metric cards screenshot', async ({ page }) => {
      Logger.startTest('Metric Cards Visual');

      await analyticsPage.navigateAndWaitForData();

      const metricsSection = page.locator('[data-testid="metrics-grid"]');
      await expect(metricsSection).toHaveScreenshot('metric-cards-chromium-darwin.png', {
        animations: 'disabled',
        mask: [
          page.locator('[data-testid="metric-value"]'),
        ],
      });
    });

    test('should match charts section screenshot', async ({ page }) => {
      Logger.startTest('Charts Section Visual');

      await analyticsPage.navigateAndWaitForData();
      await analyticsPage.verifyChartsLoaded();

      const chartsSection = page.locator('[data-testid="charts-grid"]');
      await expect(chartsSection).toHaveScreenshot('charts-section.png', {
        animations: 'disabled',
      });
    });

    test('should match conversations table screenshot', async ({ page }) => {
      Logger.startTest('Conversations Table Visual');

      await analyticsPage.navigateAndWaitForData();

      const table = page.locator('[data-testid="conversations-table"]');
      await expect(table).toHaveScreenshot('conversations-table.png', {
        animations: 'disabled',
        mask: [
          // Mask dynamic IDs and dates
          page.locator('[data-testid="conversation-id"]'),
          page.locator('[data-testid="conversation-date"]'),
        ],
      });
    });

    test('should match filter panel screenshot', async ({ page }) => {
      Logger.startTest('Filter Panel Visual');

      await analyticsPage.navigateAndWaitForData();
      await analyticsPage.openFilterPanel();

      const filterPanel = page.locator('[data-testid="filter-panel"]');
      await expect(filterPanel).toHaveScreenshot('filter-panel.png', {
        animations: 'disabled',
      });
    });

    test('should match date picker screenshot', async ({ page }) => {
      Logger.startTest('Date Picker Visual');

      await analyticsPage.navigateAndWaitForData();
      await page.click('[data-testid="date-filter"]');

      const datePicker = page.locator('[data-testid="date-filter"]');
      await expect(datePicker).toHaveScreenshot('date-picker.png', {
        animations: 'disabled',
      });
    });

    test('should match empty state screenshot', async ({ page }) => {
      Logger.startTest('Empty State Visual');

      await analyticsPage.navigateAndWaitForData();
      
      // Perform a search that returns no results
      await analyticsPage.searchInTable('xyznonexistent123456');

      const emptyState = page.locator('[data-testid="empty-state"]');
      if (await emptyState.isVisible()) {
        await expect(emptyState).toHaveScreenshot('empty-state.png', {
          animations: 'disabled',
        });
      }
    });
  });

  test.describe('Responsive Visual Tests', () => {
    test.beforeEach(async () => {
      await loginPage.navigate();
      await loginPage.login(testData.users.admin.email, testData.users.admin.password);
    });

    test('should match dashboard on mobile', async ({ page }) => {
      Logger.startTest('Dashboard Mobile Visual');

      await page.setViewportSize({ width: 375, height: 667 });
      await analyticsPage.navigateAndWaitForData();

      await expect(page).toHaveScreenshot('dashboard-mobile.png', {
        fullPage: true,
        animations: 'disabled',
        mask: [
          page.locator('[data-testid="metric-value"]'),
          page.locator('[data-testid="last-updated"]'),
        ],
      });
    });

    test('should match dashboard on tablet', async ({ page }) => {
      Logger.startTest('Dashboard Tablet Visual');

      await page.setViewportSize({ width: 768, height: 1024 });
      await analyticsPage.navigateAndWaitForData();

      await expect(page).toHaveScreenshot('dashboard-tablet.png', {
        fullPage: true,
        animations: 'disabled',
        mask: [
          page.locator('[data-testid="metric-value"]'),
          page.locator('[data-testid="last-updated"]'),
        ],
      });
    });

    test('should match dashboard on large screen', async ({ page }) => {
      Logger.startTest('Dashboard Large Screen Visual');

      await page.setViewportSize({ width: 2560, height: 1440 });
      await analyticsPage.navigateAndWaitForData();

      await expect(page).toHaveScreenshot('dashboard-large.png', {
        fullPage: true,
        animations: 'disabled',
        mask: [
          page.locator('[data-testid="metric-value"]'),
          page.locator('[data-testid="last-updated"]'),
        ],
      });
    });
  });

  test.describe('Dark Mode Visual Tests', () => {
    test.beforeEach(async ({ page }) => {
      // Emulate dark mode
      await page.emulateMedia({ colorScheme: 'dark' });
    });

    test('should match login page in dark mode', async ({ page }) => {
      Logger.startTest('Login Dark Mode Visual');

      await loginPage.navigate();

      await expect(page).toHaveScreenshot('login-dark-mode.png', {
        fullPage: true,
        animations: 'disabled',
      });
    });

    test('should match dashboard in dark mode', async ({ page }) => {
      Logger.startTest('Dashboard Dark Mode Visual');

      await loginPage.navigate();
      await loginPage.login(testData.users.admin.email, testData.users.admin.password);
      await analyticsPage.navigateAndWaitForData();

      await expect(page).toHaveScreenshot('dashboard-dark-mode.png', {
        fullPage: true,
        animations: 'disabled',
        mask: [
          page.locator('[data-testid="metric-value"]'),
          page.locator('[data-testid="last-updated"]'),
        ],
      });
    });
  });

  test.describe('Component State Visual Tests', () => {
    test.beforeEach(async () => {
      await loginPage.navigate();
      await loginPage.login(testData.users.admin.email, testData.users.admin.password);
    });

    test('should match loading state', async ({ page }) => {
      Logger.startTest('Loading State Visual');

      // Delay responses to capture loading state
      await page.route('**/api/metrics', async (route) => {
        await new Promise(resolve => setTimeout(resolve, 100));
        await route.continue();
      });

      await analyticsPage.navigate();

      // Capture loading spinner
      const spinner = page.locator('[data-testid="loading-spinner"]');
      if (await spinner.isVisible()) {
        await expect(spinner).toHaveScreenshot('loading-state.png', {
          animations: 'disabled',
        });
      }
    });

    test('should match hover states', async ({ page }) => {
      Logger.startTest('Hover States Visual');

      await analyticsPage.navigateAndWaitForData();

      // Metric card hover
      const metricCard = page.locator('[data-testid="metric-total-conversations"]');
      await metricCard.hover();
      
      await expect(metricCard).toHaveScreenshot('metric-card-hover.png', {
        animations: 'disabled',
      });
    });

    test('should match focus states', async ({ page }) => {
      Logger.startTest('Focus States Visual');

      await analyticsPage.navigateAndWaitForData();

      // Search input focus
      const searchInput = page.getByPlaceholder(/search/i);
      await searchInput.focus();

      await expect(searchInput).toHaveScreenshot('search-input-focus.png', {
        animations: 'disabled',
      });
    });

    test('should match selected filter state', async ({ page }) => {
      Logger.startTest('Selected Filter Visual');

      await analyticsPage.navigateAndWaitForData();
      await analyticsPage.openFilterPanel();
      await analyticsPage.filterBySentiment('positive');

      const filterPanel = page.locator('[data-testid="filter-panel"]');
      await expect(filterPanel).toHaveScreenshot('filter-selected.png', {
        animations: 'disabled',
      });
    });
  });

  test.describe('Animation Disabled Visual Tests', () => {
    test('should match page without animations', async ({ page }) => {
      Logger.startTest('No Animation Visual');

      // Disable animations
      await page.addStyleTag({
        content: `
          *, *::before, *::after {
            animation-duration: 0s !important;
            animation-delay: 0s !important;
            transition-duration: 0s !important;
            transition-delay: 0s !important;
          }
        `,
      });

      await loginPage.navigate();
      await loginPage.login(testData.users.admin.email, testData.users.admin.password);
      await analyticsPage.navigateAndWaitForData();

      await expect(page).toHaveScreenshot('dashboard-no-animation.png', {
        fullPage: true,
        mask: [
          page.locator('[data-testid="metric-value"]'),
          page.locator('[data-testid="last-updated"]'),
        ],
      });
    });
  });

  test.describe('Print Visual Tests', () => {
    test('should match print layout', async ({ page }) => {
      Logger.startTest('Print Layout Visual');

      await loginPage.navigate();
      await loginPage.login(testData.users.admin.email, testData.users.admin.password);
      await analyticsPage.navigateAndWaitForData();

      // Emulate print media
      await page.emulateMedia({ media: 'print' });

      await expect(page).toHaveScreenshot('dashboard-print.png', {
        fullPage: true,
        animations: 'disabled',
        mask: [
          page.locator('[data-testid="metric-value"]'),
          page.locator('[data-testid="last-updated"]'),
        ],
      });
    });
  });
});
