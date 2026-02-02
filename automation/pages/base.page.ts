import { Page, Locator, expect } from '@playwright/test';
import { Logger } from '../utils/logger';

/**
 * BasePage - Base class for all Page Object classes
 * Contains common methods and structures
 */
export abstract class BasePage {
  protected readonly page: Page;
  protected readonly logger: Logger;
  protected abstract readonly pageUrl: string;
  protected abstract readonly pageName: string;

  constructor(page: Page) {
    this.page = page;
    this.logger = new Logger(this.constructor.name);
  }

  // ==================== NAVIGATION ====================
  
  /**
   * Navigate to the page and wait for it to load
   */
  async navigate(): Promise<void> {
    this.logger.info(`Navigating to ${this.pageName}: ${this.pageUrl}`);
    await this.page.goto(this.pageUrl, { waitUntil: 'networkidle' });
    await this.waitForPageLoad();
  }

  /**
   * Wait for the page to fully load
   */
  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForLoadState('networkidle');
    this.logger.debug('Page fully loaded');
  }

  /**
   * Wait for the URL to contain a specific path
   */
  async waitForUrlContains(path: string, timeout = 10000): Promise<void> {
    this.logger.debug(`Waiting for URL to contain: ${path}`);
    await this.page.waitForURL(`**/${path}**`, { timeout });
  }

  // ==================== ELEMENT INTERACTIONS ====================

  /**
   * Wait for the element to be visible and click it
   */
  async safeClick(locator: Locator, description: string): Promise<void> {
    this.logger.action(`Clicking: ${description}`);
    await locator.waitFor({ state: 'visible', timeout: 10000 });
    await locator.click();
    this.logger.debug(`Clicked: ${description}`);
  }

  /**
   * Wait for the element to be visible and enter text
   */
  async safeFill(locator: Locator, value: string, description: string): Promise<void> {
    this.logger.action(`Filling ${description} with value`);
    await locator.waitFor({ state: 'visible', timeout: 10000 });
    await locator.clear();
    await locator.fill(value);
    this.logger.debug(`Filled: ${description}`);
  }

  /**
   * Wait for the element to be visible and get its text
   */
  async safeGetText(locator: Locator, description: string): Promise<string> {
    this.logger.debug(`Getting text from: ${description}`);
    await locator.waitFor({ state: 'visible', timeout: 10000 });
    const text = await locator.textContent();
    return text?.trim() || '';
  }

  /**
   * Find an element by role-based locator
   */
  getByRole(role: Parameters<Page['getByRole']>[0], options?: Parameters<Page['getByRole']>[1]): Locator {
    return this.page.getByRole(role, options);
  }

  /**
   * Find an element by test ID
   */
  getByTestId(testId: string): Locator {
    return this.page.getByTestId(testId);
  }

  /**
   * Find an element by label text
   */
  getByLabel(label: string): Locator {
    return this.page.getByLabel(label);
  }

  /**
   * Find an element by placeholder text
   */
  getByPlaceholder(placeholder: string): Locator {
    return this.page.getByPlaceholder(placeholder);
  }

  /**
   * Find an element by text content
   */
  getByText(text: string, options?: { exact?: boolean }): Locator {
    return this.page.getByText(text, options);
  }

  // ==================== WAIT UTILITIES ====================

  /**
   * Wait for a specific API response
   */
  async waitForApiResponse(urlPattern: string | RegExp): Promise<void> {
    this.logger.debug(`Waiting for API response: ${urlPattern}`);
    await this.page.waitForResponse(
      (response) => {
        const url = response.url();
        if (typeof urlPattern === 'string') {
          return url.includes(urlPattern);
        }
        return urlPattern.test(url);
      },
      { timeout: 30000 }
    );
    this.logger.debug('API response received');
  }

  /**
   * Wait for a specific API request and return its response
   */
  async waitForApiResponseWithData<T>(urlPattern: string | RegExp): Promise<T> {
    this.logger.debug(`Waiting for API response with data: ${urlPattern}`);
    const response = await this.page.waitForResponse(
      (response) => {
        const url = response.url();
        if (typeof urlPattern === 'string') {
          return url.includes(urlPattern);
        }
        return urlPattern.test(url);
      },
      { timeout: 30000 }
    );
    return response.json() as Promise<T>;
  }

  /**
   * Wait for the loading spinner to disappear
   */
  async waitForLoadingToDisappear(locator?: Locator): Promise<void> {
    const spinner = locator || this.getByTestId('loading-spinner');
    this.logger.debug('Waiting for loading to disappear');
    await spinner.waitFor({ state: 'hidden', timeout: 30000 });
  }

  /**
   * Wait for animations to complete
   */
  async waitForAnimations(): Promise<void> {
    await this.page.waitForTimeout(300);
  }

  // ==================== ASSERTIONS ====================

  /**
   * Assert that the element is visible
   */
  async assertVisible(locator: Locator, message?: string): Promise<void> {
    this.logger.debug(`Asserting element is visible: ${message || ''}`);
    await expect(locator, message).toBeVisible();
  }

  /**
   * Assert that the element is hidden
   */
  async assertHidden(locator: Locator, message?: string): Promise<void> {
    this.logger.debug(`Asserting element is hidden: ${message || ''}`);
    await expect(locator, message).toBeHidden();
  }

  /**
   * Assert that the element contains specific text
   */
  async assertContainsText(locator: Locator, text: string, message?: string): Promise<void> {
    this.logger.debug(`Asserting element contains text: ${text}`);
    await expect(locator, message).toContainText(text);
  }

  /**
   * Assert that the URL contains a specific path
   */
  async assertUrlContains(path: string): Promise<void> {
    this.logger.debug(`Asserting URL contains: ${path}`);
    await expect(this.page).toHaveURL(new RegExp(path));
  }

  // ==================== SCREENSHOT & DEBUG ====================

  /**
   * Take a screenshot
   */
  async takeScreenshot(name: string): Promise<Buffer> {
    this.logger.info(`Taking screenshot: ${name}`);
    return await this.page.screenshot({
      path: `test-results/screenshots/${name}-${Date.now()}.png`,
      fullPage: true,
    });
  }

  /**
   * Log the page HTML (for debugging)
   */
  async logPageContent(): Promise<void> {
    const content = await this.page.content();
    this.logger.debug(`Page content length: ${content.length} characters`);
  }

  /**
   * Listen to console messages
   */
  enableConsoleLogging(): void {
    this.page.on('console', (msg) => {
      const type = msg.type();
      const text = msg.text();
      if (type === 'error') {
        this.logger.error(`Console Error: ${text}`);
      } else if (type === 'warning') {
        this.logger.warn(`Console Warning: ${text}`);
      }
    });
  }

  // ==================== TABLE UTILITIES ====================

  /**
   * Get the number of table rows
   */
  async getTableRowCount(tableLocator: Locator): Promise<number> {
    const rows = tableLocator.locator('tbody tr');
    return await rows.count();
  }

  /**
   * Get the value of a table cell
   */
  async getTableCellValue(tableLocator: Locator, row: number, column: number): Promise<string> {
    const cell = tableLocator.locator(`tbody tr:nth-child(${row}) td:nth-child(${column})`);
    return await this.safeGetText(cell, `Table cell [${row},${column}]`);
  }

  /**
   * Find a row in the table containing specific text
   */
  async findTableRowByText(tableLocator: Locator, searchText: string): Promise<Locator | null> {
    const rows = tableLocator.locator('tbody tr');
    const count = await rows.count();
    
    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      const text = await row.textContent();
      if (text?.includes(searchText)) {
        return row;
      }
    }
    return null;
  }

  // ==================== FILTER & DYNAMIC DATA ====================

  /**
   * Select an option from a dropdown
   */
  async selectFromDropdown(
    triggerLocator: Locator,
    optionText: string,
    description: string
  ): Promise<void> {
    this.logger.action(`Selecting "${optionText}" from ${description}`);
    await this.safeClick(triggerLocator, `${description} dropdown`);
    
    const option = this.getByRole('option', { name: optionText });
    await this.safeClick(option, `Option: ${optionText}`);
  }

  /**
   * Apply a filter and wait for results
   */
  async applyFilterAndWaitForResults(
    filterLocator: Locator,
    value: string,
    apiPattern: string
  ): Promise<void> {
    this.logger.action(`Applying filter with value: ${value}`);
    
    const responsePromise = this.page.waitForResponse((response) =>
      response.url().includes(apiPattern) && response.status() === 200
    );
    
    await this.safeFill(filterLocator, value, 'Filter input');
    await responsePromise;
    
    this.logger.debug('Filter applied and data loaded');
  }
}
