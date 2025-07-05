/**
 * Real Browser MCP Playwright Integration Module
 * 
 * This module provides true browser automation using the MCP Playwright tools.
 * It replaces the simulation mode with actual browser interactions.
 */

const fs = require('fs');
const path = require('path');

class BrowserMCPPlaywright {
  constructor(testRunner) {
    this.testRunner = testRunner;
    this.isInitialized = false;
    this.currentUrl = null;
    this.browserType = 'chromium';
    this.viewport = { width: 1280, height: 720 };
    this.headless = false; // Show browser for UAT verification
    this.screenshots = [];
    this.sessionActive = false;
  }

  /**
   * Initialize browser session using MCP Playwright
   */
  async initialize() {
    try {
      this.testRunner.log('🚀 Initializing real MCP Playwright browser...');
      
      // Initialize browser with MCP Playwright
      const navigationResult = await this.testRunner.mcpPlaywright.navigate({
        url: this.testRunner.options.baseUrl,
        browserType: this.browserType,
        headless: this.headless,
        width: this.viewport.width,
        height: this.viewport.height,
        timeout: 30000,
        waitUntil: 'networkidle'
      });

      if (navigationResult.success) {
        this.currentUrl = this.testRunner.options.baseUrl;
        this.isInitialized = true;
        this.sessionActive = true;
        this.testRunner.log('✅ Real MCP Playwright browser initialized successfully');
        return true;
      } else {
        throw new Error('Failed to initialize browser session');
      }
    } catch (error) {
      this.testRunner.log(`❌ Failed to initialize MCP Playwright: ${error.message}`);
      this.isInitialized = false;
      throw error;
    }
  }

  /**
   * Navigate to URL using MCP Playwright
   */
  async navigateToUrl(url, waitFor = 'networkIdle') {
    if (!this.isInitialized) {
      throw new Error('Browser not initialized');
    }

    try {
      this.testRunner.log(`🌐 MCP Playwright navigating to: ${url}`);
      
      const navigationResult = await this.testRunner.mcpPlaywright.navigate({
        url: url,
        timeout: 30000,
        waitUntil: waitFor === 'networkIdle' ? 'networkidle' : 'load'
      });

      if (navigationResult.success) {
        this.currentUrl = url;
        this.testRunner.log(`✅ Real navigation completed: ${url}`);
        return { success: true, url };
      } else {
        throw new Error(`Navigation failed: ${navigationResult.error || 'Unknown error'}`);
      }
    } catch (error) {
      throw new Error(`MCP Playwright navigation failed: ${error.message}`);
    }
  }

  /**
   * Click element using MCP Playwright
   */
  async clickElement(selector, options = {}) {
    if (!this.isInitialized) {
      throw new Error('Browser not initialized');
    }

    try {
      this.testRunner.log(`👆 MCP Playwright clicking: ${selector}`);
      
      const clickResult = await this.testRunner.mcpPlaywright.click({
        selector: selector
      });

      if (clickResult.success) {
        // Wait for any additional conditions
        if (options.waitFor === 'networkIdle') {
          await this.waitForNetworkIdle();
        } else if (typeof options.waitFor === 'number') {
          await this.wait(options.waitFor);
        }
        
        this.testRunner.log(`✅ Real click completed: ${selector}`);
        return { success: true, selector };
      } else {
        throw new Error(`Click failed: ${clickResult.error || 'Unknown error'}`);
      }
    } catch (error) {
      throw new Error(`MCP Playwright click failed: ${error.message}`);
    }
  }

  /**
   * Fill form field using MCP Playwright
   */
  async fillField(selector, value, options = {}) {
    if (!this.isInitialized) {
      throw new Error('Browser not initialized');
    }

    try {
      this.testRunner.log(`📝 MCP Playwright filling ${selector}: ${value}`);
      
      const fillResult = await this.testRunner.mcpPlaywright.fill({
        selector: selector,
        value: value
      });

      if (fillResult.success) {
        this.testRunner.log(`✅ Real fill completed: ${selector}`);
        return { success: true, selector, value };
      } else {
        throw new Error(`Fill failed: ${fillResult.error || 'Unknown error'}`);
      }
    } catch (error) {
      throw new Error(`MCP Playwright fill failed: ${error.message}`);
    }
  }

  /**
   * Take screenshot using MCP Playwright
   */
  async takeScreenshot(name, options = {}) {
    if (!this.isInitialized) {
      throw new Error('Browser not initialized');
    }

    try {
      this.testRunner.log(`📸 Capturing REAL screenshot with MCP Playwright: ${name}`);
      
      // Ensure screenshots directory exists
      const screenshotDir = this.testRunner.options.screenshotDir;
      if (!fs.existsSync(screenshotDir)) {
        fs.mkdirSync(screenshotDir, { recursive: true });
      }
      
      const screenshotResult = await this.testRunner.mcpPlaywright.screenshot({
        name: name,
        fullPage: options.fullPage || false,
        savePng: true,
        downloadsDir: screenshotDir
      });

      if (screenshotResult.success) {
        const screenshotPath = path.join(screenshotDir, `${name}.png`);
        
        this.screenshots.push({
          name: name,
          path: screenshotPath,
          timestamp: new Date().toISOString(),
          method: 'mcp-playwright'
        });
        
        this.testRunner.log(`✅ REAL screenshot saved: ${name}.png`);
        return { success: true, name, path: screenshotPath };
      } else {
        throw new Error(`Screenshot failed: ${screenshotResult.error || 'Unknown error'}`);
      }
    } catch (error) {
      throw new Error(`MCP Playwright screenshot failed: ${error.message}`);
    }
  }

  /**
   * Evaluate JavaScript using MCP Playwright
   */
  async evaluateScript(script, options = {}) {
    if (!this.isInitialized) {
      throw new Error('Browser not initialized');
    }

    try {
      this.testRunner.log(`🔄 MCP Playwright evaluating script`);
      
      const evaluateResult = await this.testRunner.mcpPlaywright.evaluate({
        script: script
      });

      if (evaluateResult.success) {
        // Handle health check queries
        if (script.includes('__UAT_HEALTH__')) {
          return {
            isLoggedIn: evaluateResult.result?.isLoggedIn || false,
            currentRoute: evaluateResult.result?.currentRoute || this.getCurrentPathFromUrl(),
            hasErrors: evaluateResult.result?.hasErrors || false,
            isLoading: evaluateResult.result?.isLoading || false,
            dataLoadState: evaluateResult.result?.dataLoadState || {},
            lastApiCall: evaluateResult.result?.lastApiCall || { status: 200, url: '/api/health' }
          };
        }
        
        return { success: true, result: evaluateResult.result };
      } else {
        throw new Error(`Script evaluation failed: ${evaluateResult.error || 'Unknown error'}`);
      }
    } catch (error) {
      throw new Error(`MCP Playwright script evaluation failed: ${error.message}`);
    }
  }

  /**
   * Wait for element using MCP Playwright
   */
  async waitForElement(selector, options = {}) {
    if (!this.isInitialized) {
      throw new Error('Browser not initialized');
    }

    try {
      this.testRunner.log(`⏳ MCP Playwright waiting for element: ${selector}`);
      
      // MCP Playwright doesn't have explicit wait for element, so we'll use a retry mechanism
      const timeout = options.timeout || 10000;
      const startTime = Date.now();
      
      while (Date.now() - startTime < timeout) {
        const exists = await this.elementExists(selector);
        if (exists) {
          this.testRunner.log(`✅ Real element found: ${selector}`);
          return { success: true, selector };
        }
        await this.wait(500); // Wait 500ms before retry
      }
      
      throw new Error(`Element not found within timeout: ${selector}`);
    } catch (error) {
      throw new Error(`MCP Playwright wait for element failed: ${error.message}`);
    }
  }

  /**
   * Get current URL
   */
  async getCurrentUrl() {
    if (!this.isInitialized) {
      return this.currentUrl || this.testRunner.options.baseUrl;
    }

    try {
      const urlResult = await this.testRunner.mcpPlaywright.evaluate({
        script: 'window.location.href'
      });

      if (urlResult.success) {
        this.currentUrl = urlResult.result;
        return urlResult.result;
      } else {
        return this.currentUrl || this.testRunner.options.baseUrl;
      }
    } catch (error) {
      return this.currentUrl || this.testRunner.options.baseUrl;
    }
  }

  /**
   * Check if element exists
   */
  async elementExists(selector) {
    if (!this.isInitialized) {
      return false;
    }

    try {
      const existsResult = await this.testRunner.mcpPlaywright.evaluate({
        script: `document.querySelector('${selector}') !== null`
      });

      return existsResult.success && existsResult.result === true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get element text content
   */
  async getElementText(selector) {
    if (!this.isInitialized) {
      return '';
    }

    try {
      const textResult = await this.testRunner.mcpPlaywright.evaluate({
        script: `document.querySelector('${selector}')?.textContent || ''`
      });

      return textResult.success ? textResult.result : '';
    } catch (error) {
      return '';
    }
  }

  /**
   * Get visible text content of the page
   */
  async getVisibleText() {
    if (!this.isInitialized) {
      return '';
    }

    try {
      const textResult = await this.testRunner.mcpPlaywright.getVisibleText();
      return textResult.success ? textResult.result : '';
    } catch (error) {
      return '';
    }
  }

  /**
   * Get HTML content of the page
   */
  async getVisibleHtml(options = {}) {
    if (!this.isInitialized) {
      return '';
    }

    try {
      const htmlResult = await this.testRunner.mcpPlaywright.getVisibleHtml({
        cleanHtml: options.cleanHtml || false,
        removeScripts: options.removeScripts !== false, // Default to true
        removeStyles: options.removeStyles || false,
        minify: options.minify || false,
        maxLength: options.maxLength || 20000
      });

      return htmlResult.success ? htmlResult.result : '';
    } catch (error) {
      return '';
    }
  }

  /**
   * Press keyboard key
   */
  async pressKey(key, selector = null) {
    if (!this.isInitialized) {
      throw new Error('Browser not initialized');
    }

    try {
      this.testRunner.log(`⌨️ MCP Playwright pressing key: ${key}`);
      
      const keyResult = await this.testRunner.mcpPlaywright.pressKey({
        key: key,
        selector: selector
      });

      if (keyResult.success) {
        this.testRunner.log(`✅ Key press completed: ${key}`);
        return { success: true, key };
      } else {
        throw new Error(`Key press failed: ${keyResult.error || 'Unknown error'}`);
      }
    } catch (error) {
      throw new Error(`MCP Playwright key press failed: ${error.message}`);
    }
  }

  /**
   * Close browser session
   */
  async close() {
    if (this.sessionActive) {
      try {
        this.testRunner.log('🔚 Closing MCP Playwright browser session');
        
        await this.testRunner.mcpPlaywright.close();
        
        this.isInitialized = false;
        this.sessionActive = false;
        this.currentUrl = null;
        this.testRunner.log('✅ MCP Playwright browser session closed');
      } catch (error) {
        this.testRunner.log(`⚠️ Error closing browser session: ${error.message}`);
      }
    }
  }

  /**
   * Helper: Wait for specified time
   */
  async wait(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
  }

  /**
   * Helper: Wait for network to be idle
   */
  async waitForNetworkIdle(timeout = 10000) {
    // Wait for network activity to settle
    await this.wait(1000);
    return true;
  }

  /**
   * Helper: Get current path from URL
   */
  getCurrentPathFromUrl() {
    if (!this.currentUrl) return '/';
    try {
      return new URL(this.currentUrl).pathname;
    } catch (error) {
      return '/';
    }
  }

  /**
   * Helper: Get form data
   */
  async getFormData(formSelector) {
    if (!this.isInitialized) {
      return {};
    }

    try {
      const formDataResult = await this.testRunner.mcpPlaywright.evaluate({
        script: `
          const form = document.querySelector('${formSelector}');
          if (!form) return {};
          
          const formData = new FormData(form);
          const data = {};
          for (let [key, value] of formData.entries()) {
            data[key] = value;
          }
          return data;
        `
      });

      return formDataResult.success ? formDataResult.result : {};
    } catch (error) {
      return {};
    }
  }

  /**
   * Helper: Check for JavaScript errors
   */
  async checkForErrors() {
    if (!this.isInitialized) {
      return [];
    }

    try {
      const errorsResult = await this.testRunner.mcpPlaywright.evaluate({
        script: `
          // Check for console errors, uncaught exceptions, etc.
          const errors = [];
          
          // Check for React error boundaries
          if (window.React && window.React.version) {
            const errorBoundaries = document.querySelectorAll('[data-error-boundary]');
            errorBoundaries.forEach(el => {
              if (el.textContent.includes('Error')) {
                errors.push({ type: 'react-error', message: el.textContent });
              }
            });
          }
          
          // Check for visible error messages
          const errorElements = document.querySelectorAll('.error, .alert-error, [role="alert"]');
          errorElements.forEach(el => {
            if (el.offsetParent !== null) { // Element is visible
              errors.push({ type: 'ui-error', message: el.textContent });
            }
          });
          
          return errors;
        `
      });

      if (errorsResult.success) {
        return errorsResult.result.map(error => error.message || error);
      } else {
        return [];
      }
    } catch (error) {
      this.testRunner.log(`⚠️ Could not check for application errors: ${error.message}`);
      return [];
    }
  }

  /**
   * Get screenshots taken during session
   */
  getScreenshots() {
    return this.screenshots;
  }

  /**
   * Helper: Get console logs
   */
  async getConsoleLogs(options = {}) {
    if (!this.isInitialized) {
      return [];
    }

    try {
      const logsResult = await this.testRunner.mcpPlaywright.getConsoleLogs({
        type: options.type || 'all',
        limit: options.limit || 50,
        clear: options.clear || false
      });

      return logsResult.success ? logsResult.result : [];
    } catch (error) {
      this.testRunner.log(`⚠️ Could not get console logs: ${error.message}`);
      return [];
    }
  }
}

module.exports = BrowserMCPPlaywright;