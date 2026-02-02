import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * LoginPage - Giriş sayfası için Page Object
 * Authentication işlemlerini yönetir
 */
export class LoginPage extends BasePage {
  protected readonly pageUrl = '/';  // Mock server login sayfası root'ta
  protected readonly pageName = 'Login Page';

  // ==================== LOCATORS (Mock Server HTML ile eşleştirildi) ====================

  // Form elements
  private readonly emailInput: Locator;
  private readonly passwordInput: Locator;
  private readonly loginButton: Locator;
  private readonly rememberMeCheckbox: Locator;
  private readonly forgotPasswordLink: Locator;
  private readonly signUpLink: Locator;

  // Social login buttons
  private readonly googleLoginButton: Locator;
  private readonly microsoftLoginButton: Locator;
  private readonly ssoLoginButton: Locator;

  // Error & notification elements
  private readonly errorAlert: Locator;
  private readonly successToast: Locator;

  // Page elements
  private readonly logo: Locator;
  private readonly pageTitle: Locator;

  constructor(page: Page) {
    super(page);

    // Mock Server HTML'e göre güncellenmiş locator'lar
    this.emailInput = this.getByTestId('email-input');
    this.passwordInput = this.getByTestId('password-input');
    this.loginButton = this.getByTestId('login-button');
    this.rememberMeCheckbox = this.getByTestId('remember-checkbox');
    this.forgotPasswordLink = this.getByTestId('forgot-password-link');
    this.signUpLink = this.getByTestId('signup-link');

    // Social login buttons
    this.googleLoginButton = this.getByTestId('google-login');
    this.microsoftLoginButton = this.getByTestId('microsoft-login');
    this.ssoLoginButton = this.page.locator('[data-testid="sso-login"]'); // Opsiyonel

    // Error elements
    this.errorAlert = this.getByTestId('error-message');
    this.successToast = this.page.locator('[data-testid="success-toast"]'); // Opsiyonel
    this.logo = this.getByTestId('login-container');
    this.pageTitle = this.page.locator('.logo h1');
  }

  // ==================== PAGE ACTIONS ====================

  /**
   * Standart kullanıcı girişi
   */
  async login(email: string, password: string): Promise<void> {
    this.logger.info(`Attempting login for user: ${email}`);

    await this.safeFill(this.emailInput, email, 'Email field');
    await this.safeFill(this.passwordInput, password, 'Password field');
    await this.safeClick(this.loginButton, 'Login button');

    // Dashboard'a yönlendirmeyi bekle
    await this.waitForUrlContains('dashboard', 30000);
    this.logger.info('Login successful');
  }

  /**
   * Login ve API response'u bekle
   */
  async loginWithApiValidation(email: string, password: string): Promise<void> {
    this.logger.info(`Attempting login with API validation for: ${email}`);

    const responsePromise = this.page.waitForResponse(
      (response) =>
        response.url().includes('/api/auth/login') && response.status() === 200
    );

    await this.safeFill(this.emailInput, email, 'Email field');
    await this.safeFill(this.passwordInput, password, 'Password field');
    await this.safeClick(this.loginButton, 'Login button');

    const response = await responsePromise;
    const data = await response.json();

    this.logger.debug(`Login API response received, token exists: ${!!data.token}`);
    await this.waitForUrlContains('dashboard');
  }

  /**
   * "Remember Me" seçeneği ile giriş
   */
  async loginWithRememberMe(email: string, password: string): Promise<void> {
    this.logger.info(`Login with Remember Me for: ${email}`);

    await this.safeFill(this.emailInput, email, 'Email field');
    await this.safeFill(this.passwordInput, password, 'Password field');

    const isChecked = await this.rememberMeCheckbox.isChecked();
    if (!isChecked) {
      await this.safeClick(this.rememberMeCheckbox, 'Remember Me checkbox');
    }

    await this.safeClick(this.loginButton, 'Login button');
    await this.waitForUrlContains('dashboard');
  }

  /**
   * Google ile giriş butonuna tıkla
   */
  async initiateGoogleLogin(): Promise<void> {
    this.logger.info('Clicking Google login button');
    await this.safeClick(this.googleLoginButton, 'Google Login button');
    // Mock server'da gerçek OAuth yok, sadece buton tıklaması
  }

  /**
   * Microsoft ile giriş butonuna tıkla
   */
  async initiateMicrosoftLogin(): Promise<void> {
    this.logger.info('Clicking Microsoft login button');
    await this.safeClick(this.microsoftLoginButton, 'Microsoft Login button');
    // Mock server'da gerçek OAuth yok, sadece buton tıklaması
  }

  /**
   * SSO ile giriş
   */
  async initiateSSOLogin(): Promise<void> {
    this.logger.info('Initiating SSO login');
    await this.safeClick(this.ssoLoginButton, 'SSO Login button');
  }

  /**
   * Şifremi unuttum linkine tıkla
   */
  async goToForgotPassword(): Promise<void> {
    this.logger.info('Clicking Forgot Password link');
    await this.safeClick(this.forgotPasswordLink, 'Forgot Password link');
    // Mock server'da sadece # link, URL değişmez
  }

  /**
   * Kayıt ol linkine tıkla
   */
  async goToSignUp(): Promise<void> {
    this.logger.info('Clicking Sign Up link');
    await this.safeClick(this.signUpLink, 'Sign Up link');
    // Mock server'da sadece # link, URL değişmez
  }

  // ==================== VALIDATIONS ====================

  /**
   * Login sayfasının yüklendiğini doğrula
   */
  async verifyPageLoaded(): Promise<void> {
    this.logger.debug('Verifying login page loaded');
    await this.assertVisible(this.emailInput, 'Email input should be visible');
    await this.assertVisible(this.passwordInput, 'Password input should be visible');
    await this.assertVisible(this.loginButton, 'Login button should be visible');
  }

  /**
   * Hata mesajının gösterildiğini doğrula
   */
  async verifyErrorMessage(expectedMessage?: string): Promise<void> {
    this.logger.debug('Verifying error message is displayed');
    // Error mesajı görünür olmalı
    await expect(this.errorAlert).toBeVisible({ timeout: 5000 });

    if (expectedMessage) {
      await this.assertContainsText(this.errorAlert, expectedMessage);
    }
  }

  /**
   * Hata mesajının görünmediğini doğrula
   */
  async verifyNoErrorMessage(): Promise<void> {
    this.logger.debug('Verifying no error message');
    // Error mesajı gizli olmalı
    await expect(this.errorAlert).not.toBeVisible();
  }

  /**
   * Form validasyon hatalarını kontrol et
   */
  async verifyValidationErrors(): Promise<{ email: boolean; password: boolean }> {
    const emailValid = await this.emailInput.evaluate(
      (el) => (el as HTMLInputElement).validity.valid
    );
    const passwordValid = await this.passwordInput.evaluate(
      (el) => (el as HTMLInputElement).validity.valid
    );

    return {
      email: !emailValid,
      password: !passwordValid,
    };
  }

  /**
   * Sosyal giriş butonlarının görünürlüğünü doğrula
   */
  async verifySocialLoginOptions(options: {
    google?: boolean;
    microsoft?: boolean;
    sso?: boolean;
  }): Promise<void> {
    if (options.google !== undefined) {
      if (options.google) {
        await this.assertVisible(this.googleLoginButton);
      } else {
        await this.assertHidden(this.googleLoginButton);
      }
    }

    if (options.microsoft !== undefined) {
      if (options.microsoft) {
        await this.assertVisible(this.microsoftLoginButton);
      } else {
        await this.assertHidden(this.microsoftLoginButton);
      }
    }

    if (options.sso !== undefined) {
      if (options.sso) {
        await this.assertVisible(this.ssoLoginButton);
      } else {
        await this.assertHidden(this.ssoLoginButton);
      }
    }
  }

  // ==================== GETTERS ====================

  /**
   * Hata mesajı metnini al
   */
  async getErrorMessage(): Promise<string> {
    return await this.safeGetText(this.errorAlert, 'Error alert');
  }

  /**
   * Email input değerini al
   */
  async getEmailValue(): Promise<string> {
    return await this.emailInput.inputValue();
  }

  /**
   * Remember Me checkbox durumunu al
   */
  async isRememberMeChecked(): Promise<boolean> {
    return await this.rememberMeCheckbox.isChecked();
  }

  // ==================== NEGATIVE TEST HELPERS ====================

  /**
   * Geçersiz kimlik bilgileri ile giriş dene
   */
  async attemptInvalidLogin(email: string, password: string): Promise<void> {
    this.logger.info(`Attempting invalid login for: ${email}`);
    await this.safeFill(this.emailInput, email, 'Email field');
    await this.safeFill(this.passwordInput, password, 'Password field');
    await this.safeClick(this.loginButton, 'Login button');
    // Hata mesajının görünmesini bekle
    await expect(this.errorAlert).toBeVisible({ timeout: 5000 });
  }

  /**
   * Boş form ile giriş dene
   */
  async attemptEmptyLogin(): Promise<void> {
    this.logger.info('Attempting login with empty form');
    await this.safeClick(this.loginButton, 'Login button');
  }

  /**
   * Sadece email ile giriş dene
   */
  async attemptLoginWithOnlyEmail(email: string): Promise<void> {
    this.logger.info('Attempting login with only email');
    await this.safeFill(this.emailInput, email, 'Email field');
    await this.safeClick(this.loginButton, 'Login button');
  }

  /**
   * Geçersiz email formatıyla login dene (HTML5 validation tetiklenir)
   */
  async attemptLoginWithInvalidEmail(email: string, password: string): Promise<void> {
    this.logger.info(`Attempting login with invalid email format: ${email}`);
    await this.safeFill(this.emailInput, email, 'Email field');
    await this.safeFill(this.passwordInput, password, 'Password field');
    await this.safeClick(this.loginButton, 'Login button');
  }

  /**
   * Email input HTML5 validation kontrolü
   */
  async verifyEmailValidation(): Promise<boolean> {
    const isInvalid = await this.emailInput.evaluate(
      (el: HTMLInputElement) => !el.validity.valid
    );
    return isInvalid;
  }
}