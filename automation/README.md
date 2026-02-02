# 🎯 CrestaStream: AI-Driven Analytics & Support Framework

<div align="center">

![Playwright](https://img.shields.io/badge/Playwright-45ba4b?style=for-the-badge&logo=playwright&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?style=for-the-badge&logo=github-actions&logoColor=white)

**Enterprise-grade test automation framework for AI-powered analytics dashboards**

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Architecture](#-architecture)
- [Quick Start](#-quick-start)
- [Project Structure](#-project-structure)
- [Test Categories](#-test-categories)
- [Running Tests](#-running-tests)
- [CI/CD Pipeline](#-cicd-pipeline)
- [Best Practices](#-best-practices)
- [Observability](#-observability)

---

## 🎯 Overview

CrestaStream Automation Framework is a comprehensive Playwright-based test suite designed for testing AI-driven analytics dashboards. Built with enterprise standards including Page Object Model (POM), hybrid API+UI testing, and full CI/CD integration.

### Key Features

- **🎭 Multi-Browser Testing**: Chrome, Firefox, Safari, and Mobile viewports
- **🔄 Hybrid Testing**: API-driven data setup with UI verification
- **📊 Observability**: Datadog-style structured logging with trace IDs
- **🚀 CI/CD Ready**: GitHub Actions workflows with parallel execution
- **👁️ Visual Regression**: Screenshot comparison for UI consistency
- **📈 Performance Tracking**: Response time assertions and metrics

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Test Layer (specs)                        │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐ │
│  │   E2E       │ │    API      │ │    Visual Regression    │ │
│  │   Tests     │ │   Tests     │ │        Tests            │ │
│  └──────┬──────┘ └──────┬──────┘ └───────────┬─────────────┘ │
├─────────┼───────────────┼───────────────────┼───────────────┤
│         │               │                   │                │
│  ┌──────▼───────────────▼───────────────────▼──────────────┐ │
│  │              Page Object Layer (pages/)                  │ │
│  │  ┌────────────┐ ┌──────────────┐ ┌─────────────────────┐ │ │
│  │  │ BasePage   │ │  LoginPage   │ │   AnalyticsPage     │ │ │
│  │  └────────────┘ └──────────────┘ └─────────────────────┘ │ │
│  └──────────────────────────┬───────────────────────────────┘ │
├─────────────────────────────┼────────────────────────────────┤
│  ┌──────────────────────────▼───────────────────────────────┐ │
│  │               Utilities Layer (utils/)                    │ │
│  │  ┌─────────────────┐        ┌──────────────────────────┐  │ │
│  │  │   API Client    │        │      Logger              │  │ │
│  │  │  (axios/fetch)  │        │   (Datadog-style)        │  │ │
│  │  └─────────────────┘        └──────────────────────────┘  │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/crestastream-automation.git
cd crestastream-automation

# Install dependencies
npm install

# Install Playwright browsers
npx playwright install --with-deps

# Configure environment
cp .env.example .env
# Edit .env with your settings
```

### Run Your First Test

```bash
# Run all tests
npm test

# Run with UI mode (debugging)
npm run test:ui

# Run specific suite
npm run test:e2e
npm run test:api
npm run test:visual
```

---

## 📂 Project Structure

```
CrestaStream-Automation/
├── .github/workflows/          # CI/CD Pipelines
│   ├── ci.yml                  # Main CI pipeline
│   ├── pr-smoke.yml            # PR smoke tests
│   └── nightly.yml             # Nightly regression
│
├── tests/
│   ├── e2e/                    # End-to-end scenarios
│   │   ├── login.spec.ts       # Authentication flows
│   │   ├── dashboard.spec.ts   # Dashboard functionality
│   │   └── hybrid-api-ui.spec.ts # Hybrid tests
│   ├── api/                    # Backend API tests
│   │   └── conversations.api.spec.ts
│   └── visual/                 # Visual regression
│       └── visual-regression.spec.ts
│
├── pages/                      # Page Object Model
│   ├── base.page.ts            # Common methods & locators
│   ├── login.page.ts           # Login page object
│   └── analytics.page.ts       # Dashboard page object
│
├── utils/
│   ├── api-client.ts           # REST API wrapper
│   └── logger.ts               # Structured logging
│
├── fixtures/
│   └── test-data.json          # Test data & credentials
│
├── playwright.config.ts        # Playwright configuration
├── tsconfig.json               # TypeScript config
└── package.json
```

---

## 🧪 Test Categories

### 1. E2E Tests (`tests/e2e/`)

Full user journey tests simulating real user behavior.

```typescript
// Example: Login flow with API validation
test('successful login redirects to dashboard', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const analyticsPage = new AnalyticsPage(page);
  
  await loginPage.navigateAndWaitForLoad();
  await loginPage.loginWithApiValidation('admin@test.com', 'password');
  
  await expect(analyticsPage.metricCards).toBeVisible();
});
```

### 2. Hybrid API + UI Tests (`tests/e2e/hybrid-api-ui.spec.ts`)

Create data via API, verify in UI - demonstrates full system understanding.

```typescript
test('API-created conversation appears in UI', async ({ page, request }) => {
  // Create via API
  const apiClient = new ApiClient(request);
  const conversation = await apiClient.createConversation({
    title: 'Test Conversation',
    sentiment: 'positive'
  });
  
  // Verify in UI
  const analyticsPage = new AnalyticsPage(page);
  await analyticsPage.navigateAndWaitForData();
  
  const row = await analyticsPage.findConversationById(conversation.id);
  await expect(row).toBeVisible();
});
```

### 3. API Tests (`tests/api/`)

Backend validation without UI overhead.

```typescript
test('conversation CRUD operations', async ({ request }) => {
  const api = new ApiClient(request);
  
  // Create
  const created = await api.createConversation({ title: 'New' });
  expect(created.id).toBeDefined();
  
  // Read
  const fetched = await api.getConversation(created.id);
  expect(fetched.title).toBe('New');
  
  // Delete
  await api.deleteConversation(created.id);
});
```

### 4. Visual Regression Tests (`tests/visual/`)

Screenshot comparison for UI consistency.

```typescript
test('dashboard matches baseline', async ({ page }) => {
  const analyticsPage = new AnalyticsPage(page);
  await analyticsPage.navigateAndWaitForData();
  
  await expect(page).toHaveScreenshot('dashboard-full.png', {
    mask: [page.locator('[data-testid="timestamp"]')]
  });
});
```

---

## ▶️ Running Tests

### Local Development

```bash
# All tests (headless)
npm test

# With browser visible
npm run test:headed

# Debug mode
npm run test:debug

# Interactive UI mode
npm run test:ui

# Specific file
npx playwright test tests/e2e/login.spec.ts

# Specific test by title
npx playwright test -g "successful login"

# With tags
npx playwright test --grep "@smoke"
npx playwright test --grep "@performance"
```

### Parallel Execution

```bash
# 4 parallel workers
npm run test:parallel

# Custom worker count
npx playwright test --workers=8
```

### Generate Reports

```bash
# Run tests and open report
npm test && npm run test:report

# View trace file
npm run test:trace
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions Workflows

| Workflow | Trigger | Description |
|----------|---------|-------------|
| `ci.yml` | Push, PR | Full test suite with all browsers |
| `pr-smoke.yml` | PR only | Quick smoke tests for fast feedback |
| `nightly.yml` | Cron (02:00 UTC) | Full regression + performance tests |

### Pipeline Features

- ✅ **Parallel execution** across browsers
- ✅ **Sharding** for faster completion
- ✅ **Artifact upload** (reports, screenshots, videos)
- ✅ **Failure notifications** via Slack
- ✅ **Manual trigger** with test suite selection

### Example: Trigger Manual Run

```bash
gh workflow run ci.yml -f test_suite=e2e
```

---

## 🎯 Best Practices

### Advanced Locator Strategy

We follow Playwright's recommended locator hierarchy:

```typescript
// ✅ Preferred (Accessibility-first)
page.getByRole('button', { name: 'Submit' })
page.getByLabel('Email address')
page.getByPlaceholder('Enter your email')

// ✅ Good (Test IDs)
page.getByTestId('login-button')

// ⚠️ Avoid (Fragile)
page.locator('.btn-primary')
page.locator('#submit-btn')
page.locator('div > button:nth-child(2)')
```

### Page Object Pattern

```typescript
// pages/login.page.ts
export class LoginPage extends BasePage {
  // Locators using best practices
  readonly emailInput = this.page.getByLabel('Email');
  readonly passwordInput = this.page.getByLabel('Password');
  readonly submitButton = this.page.getByRole('button', { name: 'Sign in' });

  // Reusable actions
  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}
```

### Waiting Strategies

```typescript
// ✅ Wait for API response
await page.waitForResponse(resp => 
  resp.url().includes('/api/metrics') && resp.status() === 200
);

// ✅ Wait for element state
await expect(element).toBeVisible({ timeout: 10000 });

// ❌ Avoid arbitrary waits
await page.waitForTimeout(5000);
```

---

## 📊 Observability

### Structured Logging

```typescript
import { Logger } from '@utils/logger';

const logger = new Logger('LoginTest');

test('login flow', async ({ page }) => {
  Logger.startTest('Login Flow');
  
  logger.step(1, 'Navigate to login page');
  logger.apiRequest('POST', '/api/auth/login');
  logger.assertion('User logged in successfully');
  
  Logger.endTest('Login Flow', true);
});
```

### Log Output Format

```
[2024-01-15T10:30:45.123Z] [INFO] [LoginTest] [trace-abc123] Navigate to login page
[2024-01-15T10:30:45.456Z] [ACTION] [LoginTest] [trace-abc123] → POST /api/auth/login
[2024-01-15T10:30:46.789Z] [INFO] [LoginTest] [trace-abc123] ✓ User logged in successfully (1.5s)
```

### Datadog Integration (Optional)

Configure `DD_API_KEY` and `DD_APP_KEY` in your environment to send metrics to Datadog.


## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Write tests for your changes
4. Ensure all tests pass (`npm test`)
5. Submit a PR

---

<div align="center">

**Built with ❤️ for quality engineering**

</div>
