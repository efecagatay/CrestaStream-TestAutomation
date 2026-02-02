import { test, expect } from '@playwright/test';
import { ApiClient, ConversationPayload, ApiTestUtils } from '../../utils/api-client';
import { Logger } from '../../utils/logger';
import testData from '../../fixtures/test-data.json';

/**
 * API Test Suite
 * Backend API validation tests
 */
test.describe('API Tests', () => {
  let apiClient: ApiClient;
  let createdConversations: string[] = [];

  test.beforeAll(async () => {
    apiClient = new ApiClient();
    await apiClient.initialize();
  });

  test.afterAll(async () => {
    // Cleanup
    for (const id of createdConversations) {
      await ApiTestUtils.cleanupTestConversation(apiClient, id);
    }
    await apiClient.dispose();
  });

  test.afterEach(async ({ }, testInfo) => {
    Logger.endTest(
      testInfo.title,
      testInfo.status === 'passed' ? 'PASSED' : 
      testInfo.status === 'failed' ? 'FAILED' : 'SKIPPED'
    );
  });

  test.describe('Health Check', () => {
    test('should return healthy status', async () => {
      Logger.startTest('API Health Check');

      const response = await apiClient.healthCheck();

      expect(response.status).toBe(200);
      expect(response.data.status).toBe('healthy');
      expect(response.data.version).toBeDefined();
      expect(response.data.uptime).toBeGreaterThan(0);
    });

    test('should have all services up', async ({ page }) => {
      Logger.startTest('Services Health Check');

      const response = await apiClient.healthCheck();

      expect(response.status).toBe(200);
      expect(response.data.services).toBeDefined();
      await page.pause();
      
      Object.values(response.data.services).forEach((status) => {
        // Check if it is one of the positive statuses
         expect(['connected', 'operational', 'up']).toContain(status);
      });
    });
  });

  test.describe('Authentication', () => {
    test('should login with valid credentials', async () => {
      Logger.startTest('API Login - Valid Credentials');

      const { email, password } = testData.users.admin;
      const response = await apiClient.login(email, password);

      expect(response.status).toBe(200);
      expect(response.data.token).toBeDefined();
      expect(response.data.refreshToken).toBeDefined();
      expect(response.data.user.email).toBe(email);
    });

    test('should reject invalid credentials', async () => {
      Logger.startTest('API Login - Invalid Credentials');

      const response = await apiClient.login('invalid@email.com', 'wrongpassword');

      expect(response.status).toBe(401);
    });

    test('should refresh token successfully', async () => {
      Logger.startTest('API Token Refresh');

      // First login
      const loginResponse = await apiClient.login(
        testData.users.admin.email,
        testData.users.admin.password
      );
      expect(loginResponse.status).toBe(200);

      // Refresh token
      const refreshResponse = await apiClient.refreshToken(loginResponse.data.refreshToken);

      expect(refreshResponse.status).toBe(200);
      expect(refreshResponse.data.token).toBeDefined();
    });

    test('should logout successfully', async () => {
      Logger.startTest('API Logout');

      // Login
      await apiClient.login(testData.users.admin.email, testData.users.admin.password);

      // Logout
      const response = await apiClient.logout();

      expect([200, 204]).toContain(response.status);
    });
  });

  test.describe('Conversations CRUD', () => {
    test.beforeAll(async () => {
      await apiClient.login(testData.users.admin.email, testData.users.admin.password);
    });

    test('should create a new conversation', async () => {
      Logger.startTest('API Create Conversation');

      const payload: ConversationPayload = {
        agentId: 'test-agent-001',
        customerId: `api-test-${Date.now()}`,
        customerName: 'API Test Customer',
        messages: [
          {
            sender: 'customer',
            content: 'Hello from API test',
          },
        ],
      };

      const response = await apiClient.createConversation(payload);

      expect([200, 201]).toContain(response.status);
      expect(response.data.id).toBeDefined();
      expect(response.data.customerName).toBe(payload.customerName);

      createdConversations.push(response.data.id);
    });

    test('should get conversation list', async () => {
      Logger.startTest('API Get Conversations List');

      const response = await apiClient.getConversations();

      expect(response.status).toBe(200);
      expect(response.data.data).toBeInstanceOf(Array);
      expect(response.data.pagination).toBeDefined();
    });

    test('should get conversation with pagination', async ({ page }) => {
      Logger.startTest('API Conversations Pagination');

      const paginationParams = {
        page: 1,
        limit: 10,
      };
      const response = await apiClient.getConversations(paginationParams);
      console.log("Gönderilen Parametreler:", paginationParams);
      console.log("API'den Gelen Ham Veri:", response.data);

          // Test will pause here and open "Playwright Inspector"
      await page.pause();
      expect(response.status).toBe(200);
      expect(response.data.data.length).toBeLessThanOrEqual(10);
      expect(response.data.pagination.page).toBe(1);
  
      expect(response.data.pagination.limit).toBe(10);
    });

    test('should filter conversations by status', async () => {
      Logger.startTest('API Filter by Status');

      const response = await apiClient.getConversations({
        status: 'completed',
      });

      expect(response.status).toBe(200);
      response.data.data.forEach((conv) => {
        expect(conv.status).toBe('completed');
      });
    });

    test('should filter conversations by sentiment', async () => {
      Logger.startTest('API Filter by Sentiment');

      const response = await apiClient.getConversations({
        sentiment: 'positive',
      });

      expect(response.status).toBe(200);
      response.data.data.forEach((conv) => {
        expect(conv.sentiment).toBe('positive');
      });
    });

    test('should search conversations', async () => {
      Logger.startTest('API Search Conversations');

      const response = await apiClient.getConversations({
        search: 'customer',
      });

      expect(response.status).toBe(200);
    });

    test('should get single conversation', async () => {
      Logger.startTest('API Get Single Conversation');

      // First create a conversation
      const created = await ApiTestUtils.createTestConversation(apiClient);
      createdConversations.push(created.id);

      // Then get it
      const response = await apiClient.getConversation(created.id);

      expect(response.status).toBe(200);
      expect(response.data.id).toBe(created.id);
    });

    test('should update conversation', async () => {
      Logger.startTest('API Update Conversation');

      // Create conversation
      const created = await ApiTestUtils.createTestConversation(apiClient);
      createdConversations.push(created.id);

      // Update
      const response = await apiClient.updateConversation(created.id, {
        customerName: 'Updated Customer Name',
      });

      expect(response.status).toBe(200);
      expect(response.data.customerName).toBe('Updated Customer Name');
    });



    test('should delete conversation', async () => {
      Logger.startTest('API Delete Conversation');

      const created = await ApiTestUtils.createTestConversation(apiClient);

      const response = await apiClient.deleteConversation(created.id);

      expect([200, 204]).toContain(response.status);

      // Try to get the deleted conversation
      const getResponse = await apiClient.getConversation(created.id);
      expect(getResponse.status).toBe(404);
    });

    test('should return 404 for non-existent conversation', async () => {
      Logger.startTest('API 404 for Non-Existent');

      const response = await apiClient.getConversation('non-existent-id-12345');

      expect(response.status).toBe(404);
    });
  });

  test.describe('Metrics API', () => {
    test.beforeAll(async () => {
      await apiClient.login(testData.users.admin.email, testData.users.admin.password);
    });

test('should get dashboard metrics', async () => {
  Logger.startTest('API Get Metrics');

  const response = await apiClient.getMetrics();

  expect(response.status).toBe(200);
  expect(response.data.totalConversations).toBeDefined();
  expect(response.data.averageHandleTime).toBeDefined();    
  expect(response.data.averageAiScore).toBeDefined();        
  expect(response.data.resolutionRate).toBeDefined();        
  expect(response.data.positiveCount).toBeDefined();        
});

    test('should get metrics with date filter', async () => {
      Logger.startTest('API Metrics with Date Filter');

      const response = await apiClient.getMetrics({
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      });

      expect(response.status).toBe(200);
    });

    test('should get metrics trends', async () => {
      Logger.startTest('API Metrics Trends');

      const response = await apiClient.getMetrics();

      expect(response.status).toBe(200);
      expect(response.data.trends).toBeDefined();
    });
  });

  test.describe('Agents API', () => {
    test.beforeAll(async () => {
      await apiClient.login(testData.users.admin.email, testData.users.admin.password);
    });

    test('should get agents list', async () => {
      Logger.startTest('API Get Agents');

      const response = await apiClient.getAgents();

      expect(response.status).toBe(200);
      expect(response.data).toBeInstanceOf(Array);
    });
  });

  test.describe('AI Insights API', () => {
    test.beforeAll(async () => {
      await apiClient.login(testData.users.admin.email, testData.users.admin.password);
    });

    test('should get AI suggestions for conversation', async () => {
      Logger.startTest('API Get AI Suggestions');

      const created = await ApiTestUtils.createTestConversation(apiClient);
      createdConversations.push(created.id);

      const response = await apiClient.getAiSuggestions();

      expect(response.status).toBe(200);
      expect(response.data.suggestions).toBeInstanceOf(Array);

    });
  });

  test.describe('API Response Times', () => {
    test.beforeAll(async () => {
      await apiClient.login(testData.users.admin.email, testData.users.admin.password);
    });

    test('should respond within acceptable time - Health', async () => {
      Logger.startTest('API Performance - Health');

      const response = await apiClient.healthCheck();

      expect(response.duration).toBeLessThan(1000); // Less than 1 second
    });

    test('should respond within acceptable time - Conversations List', async () => {
      Logger.startTest('API Performance - Conversations');

      const response = await apiClient.getConversations({ pageSize: 10 });

      expect(response.duration).toBeLessThan(3000); // Less than 3 seconds
    });

    test('should respond within acceptable time - Metrics', async () => {
      Logger.startTest('API Performance - Metrics');

      const response = await apiClient.getMetrics();

      expect(response.duration).toBeLessThan(2000); // Less than 2 seconds
    });
  });

  test.describe('API Error Handling', () => {
    test('should handle malformed request', async () => {
      Logger.startTest('API Malformed Request');

      // Try sending invalid JSON
      const response = await apiClient.post('/api/conversations', 'invalid-json');

      expect([400, 422]).toContain(response.status);
    });


    test('should handle rate limiting gracefully', async () => {
      Logger.startTest('API Rate Limiting');

      // Send rapid consecutive requests
      const promises = Array(10).fill(null).map(() => apiClient.healthCheck());
      const responses = await Promise.all(promises);

      // Verify all requests are either successful or rate limited
      responses.forEach((response) => {
        expect([200, 429]).toContain(response.status);
      });
    });
  });
});
