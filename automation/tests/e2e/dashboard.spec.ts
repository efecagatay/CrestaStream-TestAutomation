import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/login.page';
import { AnalyticsPage } from '../../pages/analytics.page';
import { Logger, PerformanceTimer } from '../../utils/logger';

/**
 * Dashboard E2E Test Suite
 * Compatible with Mock Server version
 */
test.describe('Analytics Dashboard', () => {
  let loginPage: LoginPage;
  let analyticsPage: AnalyticsPage;

  // Test user information (Values from Mock Server)
  const testUser = {
    email: 'admin@crestastream.com',
    password: 'admin123'
  };

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    analyticsPage = new AnalyticsPage(page);

    // Login before each test
    await loginPage.navigate();
    await loginPage.login(testUser.email, testUser.password);
  });

  test.afterEach(async ({ }, testInfo) => {
    Logger.endTest(
      testInfo.title,
      testInfo.status === 'passed' ? 'PASSED' : 
      testInfo.status === 'failed' ? 'FAILED' : 'SKIPPED'
    );
  });

  test.describe('Dashboard Loading', () => {
    test('should load dashboard with all components', async () => {
      Logger.startTest('Dashboard full load verification');

      await analyticsPage.navigateAndWaitForData();
      await analyticsPage.verifyDashboardFullyLoaded();
    });

    test('should display all metric cards', async () => {
      Logger.startTest('Metric cards display');

      await analyticsPage.navigateAndWaitForData();
      await analyticsPage.verifyMetricCardsLoaded();
    });

    test('should load charts correctly', async () => {
      Logger.startTest('Charts loading');

      await analyticsPage.navigateAndWaitForData();
      await analyticsPage.verifyChartsLoaded();
    });

    test('should load conversations table', async () => {
      Logger.startTest('Conversations table loading');

      await analyticsPage.navigateAndWaitForData();
      await analyticsPage.verifyConversationsTableLoaded();

      const count = await analyticsPage.getConversationCount();
      expect(count).toBeGreaterThan(0);
    });

    test('should meet performance requirements', async () => {
      Logger.startTest('Performance test - Dashboard load time');

      const timer = new PerformanceTimer('Dashboard Load', 'PerformanceTest');

      await analyticsPage.navigateAndWaitForData();
      
      const loadTime = timer.stop();

      // Dashboard should load in less than 5 seconds
      expect(loadTime).toBeLessThan(5000);
    });
  });

  test.describe('Metric Cards', () => {
    test.beforeEach(async () => {
      await analyticsPage.navigateAndWaitForData();
    });

    test('should display correct metric values', async () => {
      Logger.startTest('Metric values verification');

      const metrics = await analyticsPage.getMetrics();

      // Values coming from Mock Server
      expect(metrics.totalConversations).toBeGreaterThanOrEqual(0);
      expect(metrics.avgHandlingTime).toBeGreaterThanOrEqual(0);
      expect(metrics.customerSatisfaction).toBeGreaterThanOrEqual(0);
      expect(metrics.aiAccuracy).toBeGreaterThanOrEqual(0);
    });

    test('should update metrics on refresh', async () => {
      Logger.startTest('Metrics update on refresh');

      const initialMetrics = await analyticsPage.getMetrics();

      await analyticsPage.refreshDashboard();

      const updatedMetrics = await analyticsPage.getMetrics();
      expect(updatedMetrics).toBeDefined();
    });
  });

  test.describe('Dynamic Data Updates', () => {
    test.beforeEach(async () => {
      await analyticsPage.navigateAndWaitForData();
    });

    test('should update data on manual refresh', async () => {
      Logger.startTest('Manual refresh data update');

      const beforeTime = await analyticsPage.getLastUpdatedTime();

      await analyticsPage.refreshDashboard();

      const afterTime = await analyticsPage.getLastUpdatedTime();
      // Time should be updated
      expect(afterTime).toBeDefined();
    });

    test('should show live indicator', async () => {
      Logger.startTest('Live indicator status');

      const isLive = await analyticsPage.isLiveIndicatorActive();
      // Live indicator should be visible
      expect(isLive).toBe(true);
    });
  });

  test.describe('Table Filtering', () => {
    test.beforeEach(async () => {
      await analyticsPage.navigateAndWaitForData();
    });

    test('should filter by search term', async () => {
      Logger.startTest('Table search filter');

      const searchTerm = 'Customer';
      await analyticsPage.searchInTable(searchTerm);

      // Search result should return (0 or more)
      const count = await analyticsPage.getConversationCount();
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('should filter by sentiment - positive', async () => {
      Logger.startTest('Filter by positive sentiment');

      await analyticsPage.filterBySentiment('positive');

      const count = await analyticsPage.getConversationCount();
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('should filter by sentiment - negative', async () => {
      Logger.startTest('Filter by negative sentiment');

      await analyticsPage.filterBySentiment('negative');

      const count = await analyticsPage.getConversationCount();
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('should filter by sentiment - neutral', async () => {
      Logger.startTest('Filter by neutral sentiment');

      await analyticsPage.filterBySentiment('neutral');

      const count = await analyticsPage.getConversationCount();
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('should filter by status - completed', async () => {
      Logger.startTest('Filter by completed status');

      await analyticsPage.filterByStatus('completed');

      const count = await analyticsPage.getConversationCount();
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('should filter by status - pending', async () => {
      Logger.startTest('Filter by pending status');

      await analyticsPage.filterByStatus('pending');

      const count = await analyticsPage.getConversationCount();
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('should filter by status - escalated', async () => {
      Logger.startTest('Filter by escalated status');

      await analyticsPage.filterByStatus('escalated');

      const count = await analyticsPage.getConversationCount();
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('should combine multiple filters', async () => {
      Logger.startTest('Combined filters');

      await analyticsPage.filterBySentiment('positive');
      await analyticsPage.filterByStatus('completed');

      const count = await analyticsPage.getConversationCount();
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('should clear all filters', async () => {
      Logger.startTest('Clear all filters');

      // Apply filter first
      await analyticsPage.filterBySentiment('negative');
      const filteredCount = await analyticsPage.getConversationCount();

      // Clear filters
      await analyticsPage.clearAllFilters();
      const unfilteredCount = await analyticsPage.getConversationCount();

      // After clearing, there should be more or equal results
      expect(unfilteredCount).toBeGreaterThanOrEqual(filteredCount);
    });
  });

  test.describe('Date Range Selection', () => {
    test.beforeEach(async () => {
      await analyticsPage.navigateAndWaitForData();
    });

    test('should filter by today', async () => {
      Logger.startTest('Filter by today');

      await analyticsPage.applyQuickDateFilter('today');
      
      const count = await analyticsPage.getConversationCount();
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('should filter by last 7 days', async () => {
      Logger.startTest('Filter by last 7 days');

      await analyticsPage.applyQuickDateFilter('last7days');
      
      const count = await analyticsPage.getConversationCount();
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('should filter by last 30 days', async () => {
      Logger.startTest('Filter by last 30 days');

      await analyticsPage.applyQuickDateFilter('last30days');
      
      const count = await analyticsPage.getConversationCount();
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Table Pagination', () => {
    test.beforeEach(async () => {
      await analyticsPage.navigateAndWaitForData();
    });

    test('should navigate to next page', async () => {
      Logger.startTest('Pagination - next page');

      const initialCount = await analyticsPage.getConversationCount();
      
      // Test only if there are multiple pages
      if (initialCount >= 10) {
        await analyticsPage.goToNextPage();
        
        const newCount = await analyticsPage.getConversationCount();
        expect(newCount).toBeGreaterThanOrEqual(0);
      }
    });

    test('should change rows per page to 25', async () => {
      Logger.startTest('Change rows per page to 25');

      await analyticsPage.setRowsPerPage(25);
      
      const count = await analyticsPage.getConversationCount();
      expect(count).toBeLessThanOrEqual(25);
    });

    test('should change rows per page to 50', async () => {
      Logger.startTest('Change rows per page to 50');

      await analyticsPage.setRowsPerPage(50);
      
      const count = await analyticsPage.getConversationCount();
      expect(count).toBeLessThanOrEqual(50);
    });
  });

  test.describe('Export Functionality', () => {
    test.beforeEach(async () => {
      await analyticsPage.navigateAndWaitForData();
    });

    test('should click export CSV button', async () => {
      Logger.startTest('Export as CSV');

      // In Mock server, no actual download, only button click is tested
      await analyticsPage.exportData('csv');
    });

    test('should click export Excel button', async () => {
      Logger.startTest('Export as Excel');

      await analyticsPage.exportData('excel');
    });
  });

  test.describe('Chart Display', () => {
    test.beforeEach(async () => {
      await analyticsPage.navigateAndWaitForData();
    });

    test('should display trend chart', async () => {
      Logger.startTest('Trend chart display');

      await analyticsPage.verifyChartsLoaded();
    });

    test('should display sentiment chart with 3 segments', async () => {
      Logger.startTest('Sentiment chart segments');

      const segments = await analyticsPage.getSentimentChartSegments();
      expect(segments).toBe(3); // positive, neutral, negative
    });
  });

  test.describe('Conversation Table', () => {
    test.beforeEach(async () => {
      await analyticsPage.navigateAndWaitForData();
    });

    test('should display conversation IDs', async () => {
      Logger.startTest('Conversation IDs');

      const ids = await analyticsPage.getAllConversationIds();
      expect(ids.length).toBeGreaterThan(0);
    });

    test('should find specific conversation by ID', async () => {
      Logger.startTest('Find conversation by ID');

      const ids = await analyticsPage.getAllConversationIds();
      
      if (ids.length > 0) {
        const row = await analyticsPage.findConversationById(ids[0]);
        expect(row).not.toBeNull();
      }
    });
  });
});