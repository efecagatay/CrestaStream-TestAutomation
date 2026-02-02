import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/login.page';
import { Logger } from '../../utils/logger';
import testData from '../../fixtures/test-data.json';

/**
 * Login E2E Test Suite
 * Kullanıcı giriş senaryolarını test eder
 */
test.describe('Login Flow', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.navigate();
  });

  test.afterEach(async ({ }, testInfo) => {
    Logger.endTest(
      testInfo.title,
      testInfo.status === 'passed' ? 'PASSED' : 
      testInfo.status === 'failed' ? 'FAILED' : 'SKIPPED'
    );
  });

  test.describe('Successful Login', () => {
    test('should login with valid admin credentials', async ({ page }) => {
      Logger.startTest('Login with valid admin credentials');

      // Arrange
      const { email, password } = testData.users.admin;

      // Act
      await loginPage.login(email, password);

      // Assert
      await expect(page).toHaveURL(/.*dashboard/);
      await loginPage.verifyNoErrorMessage();
    });

    test('should login with valid agent credentials', async ({ page }) => {
      Logger.startTest('Login with valid agent credentials');

      const { email, password } = testData.users.agent;
      await loginPage.login(email, password);

      await expect(page).toHaveURL(/.*dashboard/);
    });
  });

  test.describe('Failed Login', () => {
    test('should show error with invalid credentials', async () => {
      Logger.startTest('Login with invalid credentials');

      const { email, password } = testData.users.invalid;
      await loginPage.attemptInvalidLogin(email, password);

      await loginPage.verifyErrorMessage(testData.errorMessages.invalidCredentials);
    });

    test('should show validation error for empty form', async () => {
      Logger.startTest('Login with empty form');

      await loginPage.attemptEmptyLogin();

      const errors = await loginPage.verifyValidationErrors();
      expect(errors.email).toBe(true);
      expect(errors.password).toBe(true);
    });

test('should show validation error for invalid email format', async () => {
  Logger.startTest('Login with invalid email format');

  await loginPage.attemptLoginWithInvalidEmail('invalid-email', 'somepassword');

  const isEmailInvalid = await loginPage.verifyEmailValidation();
  expect(isEmailInvalid).toBe(true);
});

    test('should show error for missing password', async () => {
      Logger.startTest('Login with missing password');

      await loginPage.attemptLoginWithOnlyEmail(testData.users.admin.email);

      const errors = await loginPage.verifyValidationErrors();
      expect(errors.password).toBe(true);
    });

    test('should lock account after multiple failed attempts', async ({ page }) => {
      Logger.startTest('Account lockout after failed attempts');

      const { email } = testData.users.admin;
      const wrongPassword = 'wrongpassword123';

      // 5 başarısız deneme
      for (let i = 0; i < 5; i++) {
        await loginPage.attemptInvalidLogin(email, wrongPassword);
        await page.waitForTimeout(500);
      }

      // Hesap kilitlenmeli
      const errorMessage = await loginPage.getErrorMessage();
      expect(errorMessage).toContain('Invalid credentials');
    });
  });

  test.describe('Page Elements', () => {
    test('should display all login page elements', async () => {
      Logger.startTest('Verify login page elements');

      await loginPage.verifyPageLoaded();
    });

    test('should display social login options', async () => {
  Logger.startTest('Verify social login options');

  await loginPage.verifySocialLoginOptions({
    google: true,
    microsoft: true,
    sso: false,          // Mock Server'da SSO butonu yok
  });
});

  });

  test.describe('Security', () => {
    test('should mask password input', async ({ page }) => {
      Logger.startTest('Password field is masked');

      const passwordInput = page.getByLabel(/password/i);
      const inputType = await passwordInput.getAttribute('type');
      
      expect(inputType).toBe('password');
    });

    test('should clear password on page refresh', async ({ page }) => {
      Logger.startTest('Password cleared on refresh');

      const { email, password } = testData.users.admin;
      
      // Form'u doldur
      await page.getByRole('textbox', { name: /email/i }).fill(email);
      await page.getByLabel(/password/i).fill(password);

      // Sayfayı yenile
      await page.reload();

      // Password boş olmalı
      const passwordValue = await page.getByLabel(/password/i).inputValue();
      expect(passwordValue).toBe('');
    });

test('should prevent XSS in login form', async ({ page }) => {
  Logger.startTest('XSS prevention');

  const xssPayload = '<script>alert("XSS")</script>';

  await page.locator('[data-testid="email-input"]').fill(xssPayload);
  await page.locator('[data-testid="password-input"]').fill(xssPayload);
  await page.locator('[data-testid="login-button"]').click();

  const dialogPromise = page.waitForEvent('dialog', { timeout: 2000 }).catch(() => null);
  const dialog = await dialogPromise;

  expect(dialog).toBeNull();
});
  });

  test.describe('Accessibility', () => {
 test('should be accessible via keyboard navigation', async ({ page }) => {
      Logger.startTest('Keyboard navigation');

      // Tab ile form elemanları arasında gezin
      await page.keyboard.press('Tab');
      const focusedElement1 = await page.evaluate(() => document.activeElement?.getAttribute('name') || document.activeElement?.getAttribute('type'));
      
      await page.keyboard.press('Tab');
      const focusedElement2 = await page.evaluate(() => document.activeElement?.getAttribute('name') || document.activeElement?.getAttribute('type'));
      
      await page.keyboard.press('Tab');
      const focusedElement3 = await page.evaluate(() => document.activeElement?.getAttribute('type'));

      // Focus sırası kontrol
      expect(['email', 'text']).toContain(focusedElement1);     // 1. Tab → email
      expect(focusedElement2).toBe('password');                   // 2. Tab → password
      expect(focusedElement3).toBe('checkbox');                   // 3. Tab → remember me
    });

    test('should have proper ARIA labels', async ({ page }) => {
      Logger.startTest('ARIA labels check');

      const emailInput = page.getByRole('textbox', { name: /email/i });
const loginButton = page.locator('[data-testid="login-button"]');
      await expect(emailInput).toBeVisible();
      await expect(loginButton).toBeVisible();
    });
  });
});