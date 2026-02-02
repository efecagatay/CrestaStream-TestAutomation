import { APIRequestContext, APIResponse, request } from '@playwright/test';
import { Logger, PerformanceTimer } from './logger';

/**
 * API Response wrapper
 */
export interface ApiResponse<T = unknown> {
  status: number;
  statusText: string;
  data: T;
  headers: Record<string, string>;
  duration: number;
}

/**
 * Conversation create/update payload
 */
export interface ConversationPayload {
  agentId: string;
  customerId: string;
  customerName: string;
  messages?: Array<{
    sender: 'agent' | 'customer' | 'ai';
    content: string;
    timestamp?: string;
  }>;
  metadata?: Record<string, unknown>;
}

/**
 * Conversation response type
 */
export interface ConversationResponse {
  id: string;
  agentId: string;
  agentName: string;
  customerId: string;
  customerName: string;
  status: 'ongoing' | 'completed' | 'escalated';
  sentiment: 'positive' | 'neutral' | 'negative';
  aiScore: number;
  duration: number;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Pagination response wrapper
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

/**
 * Auth token response
 */
export interface AuthResponse {
  token: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

/**
 * CrestaStream API Client
 * Provides communication with the backend using Playwright request API
 */
export class ApiClient {
  private readonly baseUrl: string;
  private readonly logger: Logger;
  private context: APIRequestContext | null = null;
  private authToken: string | null = null;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || process.env.API_URL || 'https://api.crestastream.app';
    this.logger = new Logger('ApiClient');
  }

  // ==================== INITIALIZATION ====================

  /**
   * Initialize API context
   */
  async initialize(): Promise<void> {
    this.logger.info('Initializing API client');
    this.context = await request.newContext({
      baseURL: this.baseUrl,
      extraHTTPHeaders: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });
    this.logger.debug(`API client initialized with base URL: ${this.baseUrl}`);
  }

  /**
   * Close context
   */
  async dispose(): Promise<void> {
    if (this.context) {
      await this.context.dispose();
      this.context = null;
    }
  }

  /**
   * Set auth token
   */
  setAuthToken(token: string): void {
    this.authToken = token;
    this.logger.debug('Auth token set');
  }

  // ==================== GENERIC HTTP METHODS ====================

  /**
   * GET request
   */
  async get<T>(endpoint: string, params?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>('GET', endpoint, undefined, params);
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>('POST', endpoint, body);
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', endpoint, body);
  }

  /**
   * PATCH request
   */
  async patch<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>('PATCH', endpoint, body);
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', endpoint);
  }

  // ==================== AUTHENTICATION ====================

  /**
   * User login
   */
  async login(email: string, password: string): Promise<ApiResponse<AuthResponse>> {
    this.logger.info(`Logging in user: ${email}`);
    
    const response = await this.post<AuthResponse>('/api/auth/login', {
      email,
      password,
    });

    if (response.status === 200 && response.data.token) {
      this.setAuthToken(response.data.token);
      this.logger.info('Login successful');
    }

    return response;
  }

  /**
   * Refresh token
   */
  async refreshToken(refreshToken: string): Promise<ApiResponse<AuthResponse>> {
    this.logger.debug('Refreshing auth token');
    
    const response = await this.post<AuthResponse>('/api/auth/refresh', {
      refreshToken,
    });

    if (response.status === 200 && response.data.token) {
      this.setAuthToken(response.data.token);
    }

    return response;
  }

  /**
   * Logout
   */
  async logout(): Promise<ApiResponse<void>> {
    this.logger.info('Logging out');
    const response = await this.post<void>('/api/auth/logout');
    this.authToken = null;
    return response;
  }

  // ==================== CONVERSATIONS API ====================

  /**
   * Create new conversation
   */
  async createConversation(payload: ConversationPayload): Promise<ApiResponse<ConversationResponse>> {
    this.logger.info(`Creating conversation for customer: ${payload.customerName}`);
    return this.post<ConversationResponse>('/api/conversations', payload);
  }

  /**
   * Get conversation list
   */
  async getConversations(params?: {
    page?: number;
    pageSize?: number;
    status?: string;
    sentiment?: string;
    agentId?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<PaginatedResponse<ConversationResponse>>> {
    this.logger.debug('Fetching conversations list');
    
    const queryParams: Record<string, string> = {};
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams[key] = String(value);
        }
      });
    }

    return this.get<PaginatedResponse<ConversationResponse>>('/api/conversations', queryParams);
  }

  /**
   * Get single conversation detail
   */
  async getConversation(conversationId: string): Promise<ApiResponse<ConversationResponse>> {
    this.logger.debug(`Fetching conversation: ${conversationId}`);
    return this.get<ConversationResponse>(`/api/conversations/${conversationId}`);
  }

  /**
   * Update conversation
   */
  async updateConversation(
    conversationId: string,
    payload: Partial<ConversationPayload>
  ): Promise<ApiResponse<ConversationResponse>> {
    this.logger.info(`Updating conversation: ${conversationId}`);
    return this.put<ConversationResponse>(`/api/conversations/${conversationId}`, payload);
  }

  /**
   * Delete conversation
   */
  async deleteConversation(conversationId: string): Promise<ApiResponse<void>> {
    this.logger.info(`Deleting conversation: ${conversationId}`);
    return this.delete<void>(`/api/conversations/${conversationId}`);
  }

  /**
   * Add message to conversation
   */
  async addMessage(
    conversationId: string,
    message: {
      sender: 'agent' | 'customer' | 'ai';
      content: string;
    }
  ): Promise<ApiResponse<ConversationResponse>> {
    this.logger.debug(`Adding message to conversation: ${conversationId}`);
    return this.post<ConversationResponse>(
      `/api/conversations/${conversationId}/messages`,
      message
    );
  }

  // ==================== METRICS API ====================

  /**
   * Get dashboard metrics
   */
  async getMetrics(params?: {
    startDate?: string;
    endDate?: string;
    agentId?: string;
  }): Promise<ApiResponse<{
    totalConversations: number;
    averageHandleTime: number;
    averageAiScore: number;
    resolutionRate: number;
    positiveCount: number;
    trends: {
      date: string;
      conversations: number;
      satisfaction: number;
    }[];
  }>> {
    this.logger.debug('Fetching dashboard metrics');
    
    const queryParams: Record<string, string> = {};
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams[key] = String(value);
        }
      });
    }

    return this.get('/api/metrics', queryParams);
  }

  // ==================== AGENTS API ====================

  /**
   * Get agent list
   */
  async getAgents(): Promise<ApiResponse<{
    id: string;
    name: string;
    email: string;
    status: 'online' | 'offline' | 'busy';
    conversationCount: number;
    avgSatisfaction: number;
  }[]>> {
    this.logger.debug('Fetching agents list');
    return this.get('/api/agents');
  }

  // ==================== AI INSIGHTS API ====================

  /**
   * Get AI suggestions
   */
async getAiSuggestions(): Promise<ApiResponse<{
  suggestions: Array<{
    type: string;
    text: string;
    priority: string;
  }>;
}>> {
  this.logger.debug('Fetching AI suggestions');
  return this.get('/api/ai/suggestions');
}

  // ==================== HEALTH CHECK ====================

  /**
   * API health check
   */
  async healthCheck(): Promise<ApiResponse<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    version: string;
    uptime: number;
    services: Record<string, 'up' | 'down'>;
  }>> {
    this.logger.debug('Performing health check');
    return this.get('/api/health');
  }

  // ==================== PRIVATE METHODS ====================

  /**
   * General request method
   */
  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    endpoint: string,
    body?: unknown,
    params?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    if (!this.context) {
      await this.initialize();
    }

    const timer = new PerformanceTimer(`${method} ${endpoint}`, 'ApiClient');
    
    // Create URL
    let url = endpoint;
    if (params && Object.keys(params).length > 0) {
      const searchParams = new URLSearchParams(params);
      url = `${endpoint}?${searchParams.toString()}`;
    }

    // Prepare headers
    const headers: Record<string, string> = {};
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    this.logger.apiRequest(method, url, body);

    let response: APIResponse;
    
    try {
      switch (method) {
        case 'GET':
          response = await this.context!.get(url, { headers });
          break;
        case 'POST':
          response = await this.context!.post(url, { 
            headers, 
            data: body 
          });
          break;
        case 'PUT':
          response = await this.context!.put(url, { 
            headers, 
            data: body 
          });
          break;
        case 'PATCH':
          response = await this.context!.patch(url, { 
            headers, 
            data: body 
          });
          break;
        case 'DELETE':
          response = await this.context!.delete(url, { headers });
          break;
      }

      const duration = timer.stop();
      
      let data: T;
      try {
        data = await response.json() as T;
      } catch {
        data = {} as T;
      }

      const responseHeaders: Record<string, string> = {};
      const headersIterable = response.headers();
      Object.entries(headersIterable).forEach(([key, value]) => {
        responseHeaders[key] = value;
      });

      this.logger.apiResponse(method, url, response.status(), duration);

      return {
        status: response.status(),
        statusText: response.statusText(),
        data,
        headers: responseHeaders,
        duration,
      };
    } catch (error) {
      timer.stop();
      this.logger.error(`API request failed: ${method} ${url}`, {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}

/**
 * API test utilities
 */
export class ApiTestUtils {
  private static client: ApiClient;

  /**
   * Get singleton client
   */
  static async getClient(): Promise<ApiClient> {
    if (!this.client) {
      this.client = new ApiClient();
      await this.client.initialize();
    }
    return this.client;
  }

  /**
   * Create test conversation (for hybrid test)
   */
  static async createTestConversation(
    client: ApiClient,
    overrides?: Partial<ConversationPayload>
  ): Promise<ConversationResponse> {
    const defaultPayload: ConversationPayload = {
      agentId: 'test-agent-001',
      customerId: `test-customer-${Date.now()}`,
      customerName: `Test Customer ${Date.now()}`,
      messages: [
        {
          sender: 'customer',
          content: 'Hello, I need help with my order.',
          timestamp: new Date().toISOString(),
        },
        {
          sender: 'agent',
          content: 'Hi! I\'d be happy to help you. Can you please provide your order number?',
          timestamp: new Date().toISOString(),
        },
      ],
      metadata: {
        source: 'automated-test',
        testId: `test-${Date.now()}`,
      },
    };

    const payload = { ...defaultPayload, ...overrides };
    const response = await client.createConversation(payload);

    if (response.status !== 201 && response.status !== 200) {
      throw new Error(`Failed to create test conversation: ${response.status}`);
    }

    return response.data;
  }

  /**
   * Cleanup test conversation
   */
  static async cleanupTestConversation(
    client: ApiClient,
    conversationId: string
  ): Promise<void> {
    try {
      await client.deleteConversation(conversationId);
    } catch (error) {
      console.warn(`Failed to cleanup conversation ${conversationId}:`, error);
    }
  }
}
