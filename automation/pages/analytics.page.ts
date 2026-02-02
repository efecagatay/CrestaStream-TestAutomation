import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * Conversation data type
 */
export interface Conversation {
  id: string;
  agentName: string;
  customerName: string;
  duration: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  aiScore: number;
  timestamp: string;
  status: 'completed' | 'ongoing' | 'escalated';
}

/**
 * Dashboard metrics data type
 */
export interface DashboardMetrics {
  totalConversations: number;
  avgHandlingTime: number;
  customerSatisfaction: number;
  aiAccuracy: number;
  escalationRate: number;
}

/**
 * AnalyticsPage - Page Object for the Analytics Dashboard
 * Compatible with Mock Server
 */
export class AnalyticsPage extends BasePage {
  protected readonly pageUrl = '/dashboard';  // Mock Server URL
  protected readonly pageName = 'Analytics Dashboard';

  // ==================== LOCATORS ====================

  // Navigation & Header
  private readonly dashboardTitle: Locator;
  private readonly refreshButton: Locator;
  private readonly exportButton: Locator;
  private readonly settingsButton: Locator;

  // Date/Time Filters
  private readonly dateRangePicker: Locator;
  private readonly startDateInput: Locator;
  private readonly endDateInput: Locator;
  private readonly applyDateFilterButton: Locator;
  private readonly quickFilterButtons: Locator;

  // Metric Cards
  private readonly totalConversationsCard: Locator;
  private readonly avgHandlingTimeCard: Locator;
  private readonly customerSatisfactionCard: Locator;
  private readonly aiAccuracyCard: Locator;
  private readonly escalationRateCard: Locator;

  // Charts & Graphs
  private readonly conversationTrendChart: Locator;
  private readonly sentimentPieChart: Locator;
  private readonly agentPerformanceChart: Locator;
  private readonly aiSuggestionsChart: Locator;

  // Conversations Table
  private readonly conversationsTable: Locator;
  private readonly tableSearchInput: Locator;
  private readonly tableSortDropdown: Locator;
  private readonly tableFilterButton: Locator;
  private readonly tablePagination: Locator;
  private readonly tableRowsPerPage: Locator;

  // Filters Panel
  private readonly filterPanel: Locator;
  private readonly agentFilter: Locator;
  private readonly sentimentFilter: Locator;
  private readonly statusFilter: Locator;
  private readonly aiScoreFilter: Locator;
  private readonly clearFiltersButton: Locator;

  // Loading States
  private readonly loadingSpinner: Locator;
  private readonly tableLoadingSkeleton: Locator;
  private readonly chartLoadingOverlay: Locator;

  // Real-time Indicators
  private readonly liveIndicator: Locator;
  private readonly lastUpdatedTime: Locator;
  private readonly autoRefreshToggle: Locator;

  constructor(page: Page) {
    super(page);

    // Header elements (Compatible with Mock Server HTML - uses data-testid)
    this.dashboardTitle = this.getByTestId('page-title');
    this.refreshButton = this.getByTestId('refresh-button');
    this.exportButton = this.getByTestId('export-csv-button');
    this.settingsButton = this.page.locator('[data-testid="dashboard-settings"]');

    // Date filters
    this.dateRangePicker = this.getByTestId('date-filter');
    this.startDateInput = this.page.locator('#start-date');
    this.endDateInput = this.page.locator('#end-date');
    this.applyDateFilterButton = this.page.locator('button:has-text("Apply")');
    this.quickFilterButtons = this.getByTestId('date-filter');

    // Metric cards (data-testid's from Mock Server)
    this.totalConversationsCard = this.getByTestId('metric-total-conversations');
    this.avgHandlingTimeCard = this.getByTestId('metric-handle-time');
    this.customerSatisfactionCard = this.getByTestId('metric-resolution-rate');
    this.aiAccuracyCard = this.getByTestId('metric-avg-score');
    this.escalationRateCard = this.page.locator('[data-testid="metric-escalation-rate"]');

    // Charts
    this.conversationTrendChart = this.getByTestId('trend-chart');
    this.sentimentPieChart = this.getByTestId('sentiment-chart');
    this.agentPerformanceChart = this.page.locator('[data-testid="chart-agent-performance"]');
    this.aiSuggestionsChart = this.page.locator('[data-testid="chart-ai-suggestions"]');

    // Table elements (Compatible with Mock Server HTML)
    this.conversationsTable = this.getByTestId('conversations-table');
    this.tableSearchInput = this.getByTestId('search-input');
    this.tableSortDropdown = this.page.locator('th[data-sort]');
    this.tableFilterButton = this.page.locator('button:has-text("Filter")');
    this.tablePagination = this.getByTestId('pagination');
    this.tableRowsPerPage = this.getByTestId('rows-per-page');

    // Filter panel (Compatible with Mock Server HTML)
    this.filterPanel = this.getByTestId('filter-panel');
    this.agentFilter = this.getByTestId('agent-filter');
    this.sentimentFilter = this.getByTestId('sentiment-filter');
    this.statusFilter = this.getByTestId('status-filter');
    this.aiScoreFilter = this.page.locator('#ai-score-filter');
    this.clearFiltersButton = this.getByTestId('clear-filters-button');

    // Loading states
    this.loadingSpinner = this.page.locator('#loading-overlay');
    this.tableLoadingSkeleton = this.page.locator('.loading-skeleton');
    this.chartLoadingOverlay = this.page.locator('.chart-loading');

    // Real-time indicators (Compatible with Mock Server HTML)
    this.liveIndicator = this.getByTestId('live-indicator');
    this.lastUpdatedTime = this.getByTestId('last-updated');
    this.autoRefreshToggle = this.page.locator('#auto-refresh-toggle');
  }

  // ==================== NAVIGATION ====================

  /**
   * Go to the Analytics page and wait for data to load
   */
  async navigateAndWaitForData(): Promise<void> {
    this.logger.info('Navigating to Analytics Dashboard');
    
    // Create promises for API responses
    const metricsPromise = this.page.waitForResponse(
      (response) => response.url().includes('/api/metrics') && response.status() === 200
    );
    const conversationsPromise = this.page.waitForResponse(
      (response) => response.url().includes('/api/conversations') && response.status() === 200
    );

    await this.navigate();

    // Wait for all data to load in parallel
    await Promise.all([metricsPromise, conversationsPromise]);
    
    // Wait for loading spinner to disappear (if present)
    try {
      await this.loadingSpinner.waitFor({ state: 'hidden', timeout: 5000 });
    } catch {
      // Continue if no loading spinner
    }

    this.logger.info('Analytics Dashboard loaded with data');
  }

  // ==================== METRIC CARD OPERATIONS ====================

  /**
   * Verify all metric cards are loaded
   * There are 4 metric cards in the Mock Server
   */
  async verifyMetricCardsLoaded(): Promise<void> {
    this.logger.debug('Verifying all metric cards are loaded');

    await Promise.all([
      this.assertVisible(this.totalConversationsCard),
      this.assertVisible(this.avgHandlingTimeCard),
      this.assertVisible(this.customerSatisfactionCard),
      this.assertVisible(this.aiAccuracyCard),
    ]);
  }

  /**
   * Open the filter panel
   */
  async openFilterPanel(): Promise<void> {
    this.logger.action('Opening filter panel');
    
    // Do not click again if already open
    if (await this.filterPanel.isVisible()) {
      this.logger.debug('Filter panel is already open');
      return;
    }

    // Use 'tableFilterButton' defined in constructor
    await this.safeClick(this.tableFilterButton, 'Open Filter Button');
    
    // Wait for panel to become visible (important for animations)
    await this.filterPanel.waitFor({ state: 'visible' });
  }

  /**
   * Get dashboard metrics
   */
  async getMetrics(): Promise<DashboardMetrics> {
    this.logger.debug('Getting dashboard metrics');

    const [total, avgTime, satisfaction, accuracy] = await Promise.all([
      this.getMetricValue(this.totalConversationsCard),
      this.getMetricValue(this.avgHandlingTimeCard),
      this.getMetricValue(this.customerSatisfactionCard),
      this.getMetricValue(this.aiAccuracyCard),
    ]);

    return {
      totalConversations: total,
      avgHandlingTime: avgTime,
      customerSatisfaction: satisfaction,
      aiAccuracy: accuracy,
      escalationRate: 0, // Not present in mock server
    };
  }

  /**
   * Get the value of a single metric card
   */
  private async getMetricValue(card: Locator): Promise<number> {
    const valueElement = card.locator('[data-testid="metric-value"]');
    const text = await this.safeGetText(valueElement, 'Metric value');
    return parseFloat(text.replace(/[^0-9.]/g, '')) || 0;
  }

  // ==================== CHART OPERATIONS ====================

  /**
   * Verify that charts are loaded
   */
  async verifyChartsLoaded(): Promise<void> {
    this.logger.debug('Verifying charts are loaded');

    await Promise.all([
      this.assertVisible(this.conversationTrendChart),
      this.assertVisible(this.sentimentPieChart),
    ]);
  }

  /**
   * Get the number of data points in the trend chart
   */
  async getTrendChartDataPoints(): Promise<number> {
    const dataPoints = this.conversationTrendChart.locator('[data-testid="data-point"]');
    return await dataPoints.count();
  }

  /**
   * Get the number of segments in the sentiment pie chart
   */
  async getSentimentChartSegments(): Promise<number> {
    const segments = this.sentimentPieChart.locator('.sentiment-bar');
    return await segments.count();
  }

  // ==================== TABLE OPERATIONS ====================

  /**
   * Verify that the conversation table is loaded
   */
  async verifyConversationsTableLoaded(): Promise<void> {
    this.logger.debug('Verifying conversations table is loaded');
    await this.assertVisible(this.conversationsTable);
  }

  /**
   * Search in the table and wait for results
   */
  async searchInTable(searchTerm: string): Promise<void> {
    this.logger.action(`Searching for: ${searchTerm}`);

    const responsePromise = this.page.waitForResponse(
      (response) =>
        response.url().includes('/api/conversations') &&
        response.status() === 200
    );

    await this.safeFill(this.tableSearchInput, searchTerm, 'Table search');
    await responsePromise;

    this.logger.debug('Search completed');
  }

  /**
   * Get the number of rows in the table
   */
  async getConversationCount(): Promise<number> {
    return await this.getTableRowCount(this.conversationsTable);
  }

  /**
   * Find a specific conversation in the table by ID
   */
  async findConversationById(conversationId: string): Promise<Locator | null> {
    this.logger.debug(`Looking for conversation: ${conversationId}`);
    return await this.findTableRowByText(this.conversationsTable, conversationId);
  }

  /**
   * Go to the conversation details page
   */
  async openConversationDetails(conversationId: string): Promise<void> {
    this.logger.action(`Opening conversation details: ${conversationId}`);

    const row = await this.findConversationById(conversationId);
    if (!row) {
      throw new Error(`Conversation not found: ${conversationId}`);
    }

    const titleCell = row.locator('.conversation-title');
    await this.safeClick(titleCell, 'Conversation title');
  }

  /**
   * Get all conversation IDs from the table
   */
  async getAllConversationIds(): Promise<string[]> {
    const rows = this.conversationsTable.locator('tbody tr');
    const count = await rows.count();
    const ids: string[] = [];

    for (let i = 0; i < count; i++) {
      const idCell = rows.nth(i).locator('[data-testid="conversation-id"]');
      const id = await this.safeGetText(idCell, `Conversation ID ${i}`);
      if (id) ids.push(id);
    }

    return ids;
  }

  // ==================== FILTER OPERATIONS ====================

  /**
   * Apply sentiment filter
   */
  async filterBySentiment(sentiment: 'positive' | 'neutral' | 'negative'): Promise<void> {
    this.logger.action(`Filtering by sentiment: ${sentiment}`);

    const responsePromise = this.page.waitForResponse(
      (response) => response.url().includes('/api/conversations') && response.status() === 200
    );

    await this.sentimentFilter.selectOption(sentiment);
    await responsePromise;
  }

  /**
   * Apply status filter
   */
  async filterByStatus(status: string): Promise<void> {
    this.logger.action(`Filtering by status: ${status}`);

    const responsePromise = this.page.waitForResponse(
      (response) => response.url().includes('/api/conversations') && response.status() === 200
    );

    await this.statusFilter.selectOption(status);
    await responsePromise;
  }

  /**
   * Apply agent filter
   */
  async filterByAgent(agentId: string): Promise<void> {
    this.logger.action(`Filtering by agent: ${agentId}`);

    const responsePromise = this.page.waitForResponse(
      (response) => response.url().includes('/api/conversations') && response.status() === 200
    );

    await this.agentFilter.selectOption(agentId);
    await responsePromise;
  }

  /**
   * Clear all filters
   */
  async clearAllFilters(): Promise<void> {
    this.logger.action('Clearing all filters');

    const responsePromise = this.page.waitForResponse(
      (response) => response.url().includes('/api/conversations') && response.status() === 200
    );

    await this.safeClick(this.clearFiltersButton, 'Clear filters');
    await responsePromise;
  }

  // ==================== DATE RANGE OPERATIONS ====================

  /**
   * Apply quick date filter (Today, Last 7 Days, etc.)
   */
  async applyQuickDateFilter(filter: 'today' | 'yesterday' | 'last7days' | 'last30days'): Promise<void> {
    this.logger.action(`Applying quick date filter: ${filter}`);

    const responsePromise = this.page.waitForResponse(
      (response) => response.url().includes('/api/conversations') && response.status() === 200
    );

    await this.dateRangePicker.selectOption(filter);
    await responsePromise;
  }

  // ==================== REAL-TIME FEATURES ====================

  /**
   * Check if live indicator is active
   */
  async isLiveIndicatorActive(): Promise<boolean> {
    return await this.liveIndicator.isVisible();
  }

  /**
   * Get the last updated time
   */
  async getLastUpdatedTime(): Promise<string> {
    return await this.safeGetText(this.lastUpdatedTime, 'Last updated time');
  }

  /**
   * Manually refresh the dashboard and wait for data to update
   */
  async refreshDashboard(): Promise<void> {
    this.logger.action('Refreshing dashboard');

    const responsePromise = Promise.all([
      this.page.waitForResponse((r) => r.url().includes('/api/metrics') && r.status() === 200),
      this.page.waitForResponse((r) => r.url().includes('/api/conversations') && r.status() === 200),
    ]);

    await this.safeClick(this.refreshButton, 'Refresh button');
    await responsePromise;

    this.logger.debug('Dashboard refreshed');
  }

  // ==================== EXPORT OPERATIONS ====================

  /**
   * Export dashboard data
   */
  async exportData(format: 'csv' | 'excel'): Promise<void> {
    this.logger.action(`Exporting data as ${format}`);

    if (format === 'csv') {
      await this.safeClick(this.exportButton, 'Export CSV button');
    } else {
      const excelButton = this.getByTestId('export-excel-button');
      await this.safeClick(excelButton, 'Export Excel button');
    }
  }

  // ==================== PAGINATION ====================

  /**
   * Go to the next page
   */
  async goToNextPage(): Promise<void> {
    this.logger.action('Going to next page');
    
    const responsePromise = this.page.waitForResponse(
      (response) => response.url().includes('/api/conversations') && response.status() === 200
    );

    const nextButton = this.getByTestId('next-page-button');
    await this.safeClick(nextButton, 'Next page button');
    await responsePromise;
  }

  /**
   * Go to the previous page
   */
  async goToPreviousPage(): Promise<void> {
    this.logger.action('Going to previous page');
    
    const responsePromise = this.page.waitForResponse(
      (response) => response.url().includes('/api/conversations') && response.status() === 200
    );

    const prevButton = this.getByTestId('prev-page-button');
    await this.safeClick(prevButton, 'Previous page button');
    await responsePromise;
  }

  /**
   * Change the number of rows per page
   */
  async setRowsPerPage(count: 10 | 25 | 50 | 100): Promise<void> {
    this.logger.action(`Setting rows per page: ${count}`);
    
    const responsePromise = this.page.waitForResponse(
      (response) => response.url().includes('/api/conversations') && response.status() === 200
    );

    await this.tableRowsPerPage.selectOption(count.toString());
    await responsePromise;
  }

  // ==================== VERIFICATION HELPERS ====================

  /**
   * Verify that the dashboard is fully loaded
   */
  async verifyDashboardFullyLoaded(): Promise<void> {
    this.logger.info('Verifying dashboard is fully loaded');

    await Promise.all([
      this.verifyMetricCardsLoaded(),
      this.verifyChartsLoaded(),
      this.verifyConversationsTableLoaded(),
    ]);

    this.logger.info('Dashboard verification complete');
  }

  /**
   * Verify that a specific conversation appears in the table
   */
  async verifyConversationInTable(conversationId: string): Promise<void> {
    this.logger.debug(`Verifying conversation in table: ${conversationId}`);
    const row = await this.findConversationById(conversationId);
    expect(row, `Conversation ${conversationId} should be in table`).not.toBeNull();
  }

  /**
   * Verify that metrics have specific values
   */
  async verifyMetricValues(expected: Partial<DashboardMetrics>): Promise<void> {
    const actual = await this.getMetrics();

    if (expected.totalConversations !== undefined) {
      expect(actual.totalConversations).toBe(expected.totalConversations);
    }
    if (expected.avgHandlingTime !== undefined) {
      expect(actual.avgHandlingTime).toBeCloseTo(expected.avgHandlingTime, 1);
    }
    if (expected.customerSatisfaction !== undefined) {
      expect(actual.customerSatisfaction).toBeCloseTo(expected.customerSatisfaction, 1);
    }
    if (expected.aiAccuracy !== undefined) {
      expect(actual.aiAccuracy).toBeCloseTo(expected.aiAccuracy, 1);
    }
  }
}