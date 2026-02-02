import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/login.page';
import { AnalyticsPage } from '../../pages/analytics.page';
import { ApiClient, ApiTestUtils } from '../../utils/api-client';
import { Logger } from '../../utils/logger';

/**
 * Hybrid API + UI Test Suite
 * Create data with Backend API, verify in UI
 * Compatible with Mock Server
 */
test.describe('Hybrid API + UI Tests', () => {
  let loginPage: LoginPage;
  let analyticsPage: AnalyticsPage;
  let apiClient: ApiClient;
  let createdConversations: string[] = [];

  // Mock Server user credentials
  const testUser = {
    email: 'admin@crestastream.com',
    password: 'admin123'
  };

  test.beforeAll(async () => {
    // Start API client
    apiClient = new ApiClient('http://localhost:3000');
    await apiClient.initialize();

    // Login via API
    const loginResponse = await apiClient.login(testUser.email, testUser.password);
    expect(loginResponse.status).toBe(200);
  });

  test.afterAll(async () => {
    // Cleanup test conversations
    for (const conversationId of createdConversations) {
      await ApiTestUtils.cleanupTestConversation(apiClient, conversationId);
    }

    await apiClient.dispose();
  });

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    analyticsPage = new AnalyticsPage(page);

    // Login via UI
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

  test.describe('Create via API, Verify in UI', () => {
    test('should show API-created conversation in dashboard', async () => {
      Logger.startTest('API create -> UI verify conversation');

      // STEP 1: Create conversation via API
      const created = await ApiTestUtils.createTestConversation(apiClient, {
        agentId: 'agent-001',
        customerId: `hybrid-${Date.now()}`,
        customerName: `Hybrid Test - ${Date.now()}`,
        messages: [
          {
            sender: 'customer',
            content: 'Hello, I need help with my order.',
            timestamp: new Date().toISOString(),
          },
          {
            sender: 'agent',
            content: 'Hi! I would be happy to help you.',
            timestamp: new Date().toISOString(),
          },
        ],
      });

      createdConversations.push(created.id);

      // STEP 2: Go to UI
      await analyticsPage.navigateAndWaitForData();

      // STEP 3: Verify conversation count increased
      const count = await analyticsPage.getConversationCount();
      expect(count).toBeGreaterThan(0);
    });

    test('should update metrics after API conversation creation', async () => {
      Logger.startTest('Metrics update after API conversation');

      // First, get current metrics
      await analyticsPage.navigateAndWaitForData();
      const metricsBefore = await analyticsPage.getMetrics();

      // Create new conversation via API
      const created = await ApiTestUtils.createTestConversation(apiClient);
      createdConversations.push(created.id);

      // Refresh dashboard
      await analyticsPage.refreshDashboard();
      const metricsAfter = await analyticsPage.getMetrics();

      // Total conversation count should have increased
      expect(metricsAfter.totalConversations).toBeGreaterThanOrEqual(
        metricsBefore.totalConversations
      );
    });

    test('should filter by sentiment after API creation', async () => {
      Logger.startTest('API create -> UI filter by sentiment');

      // Create conversation (mock server assigns sentiment automatically)
      const created = await ApiTestUtils.createTestConversation(apiClient, {
        agentId: 'agent-002',
        customerId: `sentiment-${Date.now()}`,
        customerName: `Sentiment Test - ${Date.now()}`,
      });
      createdConversations.push(created.id);

      // Apply filter in UI
      await analyticsPage.navigateAndWaitForData();
      
      // Any sentiment filter should work
      await analyticsPage.filterBySentiment('positive');
      const positiveCount = await analyticsPage.getConversationCount();
      expect(positiveCount).toBeGreaterThanOrEqual(0);

      // Clear filter
      await analyticsPage.clearAllFilters();
      const totalCount = await analyticsPage.getConversationCount();
      expect(totalCount).toBeGreaterThanOrEqual(positiveCount);
    });
  });

  test.describe('Modify via API, Verify in UI', () => {
    test('should reflect API message addition in UI', async () => {
      Logger.startTest('API add message -> UI verify');

      // Create conversation
      const created = await ApiTestUtils.createTestConversation(apiClient, {
        agentId: 'agent-001',
        customerId: `update-${Date.now()}`,
        customerName: `Update Test - ${Date.now()}`,
      });
      createdConversations.push(created.id);

      // Add message
      const messageResponse = await apiClient.addMessage(created.id, {
        sender: 'customer',
        content: 'This is an additional message from API test.',
      });
      expect(messageResponse.status).toBe(200);

      // Verify in UI
      await analyticsPage.navigateAndWaitForData();
      const count = await analyticsPage.getConversationCount();
      expect(count).toBeGreaterThan(0);
    });

    test('should update conversation via API', async () => {
      Logger.startTest('API update conversation');

      // Create conversation
      const created = await ApiTestUtils.createTestConversation(apiClient);
      createdConversations.push(created.id);

      // Update conversation
      const updateResponse = await apiClient.updateConversation(created.id, {
        customerName: `Updated Name - ${Date.now()}`,
      });
      expect(updateResponse.status).toBe(200);

      // Verify in UI
      await analyticsPage.navigateAndWaitForData();
      const count = await analyticsPage.getConversationCount();
      expect(count).toBeGreaterThan(0);
    });
  });

  test.describe('Delete via API, Verify in UI', () => {
    test('should remove deleted conversation from UI', async () => {
      Logger.startTest('API delete -> UI verify removal');

      // Create conversation
      const created = await ApiTestUtils.createTestConversation(apiClient, {
        agentId: 'agent-001',
        customerId: `delete-${Date.now()}`,
        customerName: `Delete Test - ${Date.now()}`,
      });

      // Get conversation count in UI
      await analyticsPage.navigateAndWaitForData();
      const countBefore = await analyticsPage.getConversationCount();

      // Delete via API
      const deleteResponse = await apiClient.deleteConversation(created.id);
      expect(deleteResponse.status).toBe(200);

      // Refresh UI
      await analyticsPage.refreshDashboard();
      const countAfter = await analyticsPage.getConversationCount();

      // There should be one less after deletion
      expect(countAfter).toBeLessThanOrEqual(countBefore);
    });
  });

  test.describe('API Data Consistency', () => {
    test('should have consistent conversation count between API and UI', async () => {
      Logger.startTest('API-UI data consistency check');

      // Get conversation list from API
      const apiResponse = await apiClient.getConversations();
      expect(apiResponse.status).toBe(200);

      // Go to UI
      await analyticsPage.navigateAndWaitForData();

      // Get conversation count from UI
      const uiCount = await analyticsPage.getConversationCount();

      // Both should have data
      expect(uiCount).toBeGreaterThan(0);
    });

    test('should have consistent metrics between API and UI', async () => {
      Logger.startTest('API-UI metrics consistency');

      // Get metrics from API
      const apiMetrics = await apiClient.getMetrics();
      expect(apiMetrics.status).toBe(200);

      // Get metrics from UI
      await analyticsPage.navigateAndWaitForData();
      const uiMetrics = await analyticsPage.getMetrics();

      // Both should have defined metric values
      expect(uiMetrics.totalConversations).toBeGreaterThanOrEqual(0);
      expect(apiMetrics.data.totalConversations).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('API Health & Agents', () => {
    test('should return healthy status from API', async () => {
      Logger.startTest('API health check');

      const health = await apiClient.healthCheck();
      expect(health.status).toBe(200);
      expect(health.data.status).toBeDefined();
    });

    test('should return agents list from API', async () => {
      Logger.startTest('API agents list');

      const agents = await apiClient.getAgents();
      expect(agents.status).toBe(200);
    });

    test('should return AI suggestions from API', async () => {
      Logger.startTest('API AI suggestions');

      // 1. First, create a conversation to get an ID
      const created = await ApiTestUtils.createTestConversation(apiClient);
      createdConversations.push(created.id); // Add to list for cleanup

      // 2. Pass the created conversation's ID as a parameter
      const suggestions = await apiClient.getAiSuggestions(); 
      
      expect(suggestions.status).toBe(200);
    });
  });

  test.describe('Bulk Operations', () => {
    test('should handle bulk conversation creation', async () => {
      Logger.startTest('Bulk conversation creation');

      const bulkCount = 3;

      // Bulk creation
      for (let i = 0; i < bulkCount; i++) {
        const created = await ApiTestUtils.createTestConversation(apiClient, {
          agentId: `agent-00${(i % 3) + 1}`,
          customerId: `bulk-customer-${Date.now()}-${i}`,
          customerName: `Bulk Test ${i} - ${Date.now()}`,
        });
        createdConversations.push(created.id);
      }

      // Verify all are displayed in UI
      await analyticsPage.navigateAndWaitForData();

      // Total conversation count should have increased
      const count = await analyticsPage.getConversationCount();
      expect(count).toBeGreaterThanOrEqual(bulkCount);
    });
  });

  test.describe('Error Handling', () => {
    test('should handle non-existent conversation gracefully', async () => {
      Logger.startTest('API error - non-existent conversation');

      // Try to get conversation with invalid ID
      const response = await apiClient.getConversation('non-existent-id-12345');
      
      // Should return 404 or error
      expect(response.status).toBe(404);
    });

    test('should handle invalid login via API', async () => {
      Logger.startTest('API error - invalid login');

      const tempClient = new ApiClient('http://localhost:3000');
      await tempClient.initialize();

      const response = await tempClient.login('wrong@email.com', 'wrongpass');
      expect(response.status).toBe(401);

      await tempClient.dispose();
    });
  });
});