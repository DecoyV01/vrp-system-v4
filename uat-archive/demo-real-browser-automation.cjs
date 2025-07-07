#!/usr/bin/env node

/**
 * Real Browser Automation Demo
 * 
 * This script demonstrates how to use the UAT framework with real MCP Playwright tools
 * for actual browser automation and screenshot capture.
 */

const UATTestRunner = require('./engine/test-runner.cjs');
const path = require('path');

class RealBrowserAutomationDemo {
  constructor() {
    // Configure test runner for real browser automation
    this.testRunner = new UATTestRunner({
      baseUrl: 'https://vrp-system-v4.pages.dev',
      useMCPPlaywright: true,
      debugMode: true,
      screenshotDir: '/mnt/c/projects/vrp-system/v4/uat/screenshots',
      timeout: 30000
    });

    // These tool references would be injected by Claude Code when running in MCP context
    this.mcpPlaywrightTools = {
      navigate: this.mockNavigate.bind(this),
      click: this.mockClick.bind(this),
      fill: this.mockFill.bind(this),
      screenshot: this.mockScreenshot.bind(this),
      evaluate: this.mockEvaluate.bind(this),
      getVisibleText: this.mockGetVisibleText.bind(this),
      getVisibleHtml: this.mockGetVisibleHtml.bind(this),
      pressKey: this.mockPressKey.bind(this),
      close: this.mockClose.bind(this),
      getConsoleLogs: this.mockGetConsoleLogs.bind(this)
    };
  }

  /**
   * Mock MCP Playwright tool implementations for demonstration
   * In real usage, these would be actual MCP tool calls
   */
  async mockNavigate(params) {
    console.log(`🌐 MCP Playwright Navigate: ${params.url}`);
    console.log(`   Browser: ${params.browserType || 'chromium'}`);
    console.log(`   Viewport: ${params.width || 1280}x${params.height || 720}`);
    console.log(`   Headless: ${params.headless || false}`);
    return { success: true, url: params.url };
  }

  async mockClick(params) {
    console.log(`👆 MCP Playwright Click: ${params.selector}`);
    return { success: true, selector: params.selector };
  }

  async mockFill(params) {
    console.log(`📝 MCP Playwright Fill: ${params.selector} = "${params.value}"`);
    return { success: true, selector: params.selector, value: params.value };
  }

  async mockScreenshot(params) {
    console.log(`📸 MCP Playwright Screenshot: ${params.name}`);
    console.log(`   Full page: ${params.fullPage || false}`);
    console.log(`   Save path: ${params.downloadsDir}/${params.name}.png`);
    
    // Simulate creating a screenshot file
    const fs = require('fs');
    const screenshotPath = path.join(params.downloadsDir || '/tmp', `${params.name}.png`);
    
    // Ensure directory exists
    if (!fs.existsSync(path.dirname(screenshotPath))) {
      fs.mkdirSync(path.dirname(screenshotPath), { recursive: true });
    }
    
    // Create a simple placeholder file
    fs.writeFileSync(screenshotPath, 'Mock screenshot data - replace with real PNG in production');
    
    return { success: true, name: params.name, path: screenshotPath };
  }

  async mockEvaluate(params) {
    console.log(`⚙️ MCP Playwright Evaluate: ${params.script.substring(0, 50)}...`);
    
    // Simulate realistic health check responses
    if (params.script.includes('__UAT_HEALTH__')) {
      return {
        success: true,
        result: {
          isLoggedIn: true,
          currentRoute: '/projects',
          hasErrors: false,
          isLoading: false,
          dataLoadState: { projects: 'success' },
          lastApiCall: { status: 200, url: '/api/projects' }
        }
      };
    }
    
    if (params.script.includes('window.location.href')) {
      return { success: true, result: 'https://vrp-system-v4.pages.dev/projects' };
    }
    
    if (params.script.includes('document.querySelector')) {
      return { success: true, result: true }; // Element exists
    }
    
    return { success: true, result: 'Script executed successfully' };
  }

  async mockGetVisibleText() {
    console.log(`📄 MCP Playwright Get Visible Text`);
    return {
      success: true,
      result: 'VRP System Projects Dashboard Vehicle Management Create New Project...'
    };
  }

  async mockGetVisibleHtml(params) {
    console.log(`📝 MCP Playwright Get Visible HTML`);
    console.log(`   Clean HTML: ${params.cleanHtml || false}`);
    console.log(`   Remove scripts: ${params.removeScripts !== false}`);
    return {
      success: true,
      result: '<div class="dashboard"><h1>VRP System</h1><div class="projects">...</div></div>'
    };
  }

  async mockPressKey(params) {
    console.log(`⌨️ MCP Playwright Press Key: ${params.key}`);
    return { success: true, key: params.key };
  }

  async mockClose() {
    console.log(`🔚 MCP Playwright Close Browser`);
    return { success: true };
  }

  async mockGetConsoleLogs(params) {
    console.log(`📋 MCP Playwright Get Console Logs: ${params.type || 'all'}`);
    return {
      success: true,
      result: [
        { level: 'log', message: 'React app started successfully' },
        { level: 'info', message: 'Convex connection established' }
      ]
    };
  }

  /**
   * Demonstrate real browser automation workflow
   */
  async demonstrateRealBrowserAutomation() {
    console.log('🚀 Starting Real Browser Automation Demo');
    console.log('==========================================');

    try {
      // Set up MCP Playwright tools
      this.testRunner.setMCPPlaywrightTools(this.mcpPlaywrightTools);

      // Initialize the test environment
      console.log('\n1. Initializing UAT environment...');
      await this.testRunner.initialize();

      // Run a simple login scenario
      console.log('\n2. Executing login scenario...');
      await this.demonstrateLoginScenario();

      // Run CRUD operations
      console.log('\n3. Executing CRUD operations...');
      await this.demonstrateCRUDOperations();

      // Generate report
      console.log('\n4. Generating test report...');
      const report = this.testRunner.generateReport();
      
      console.log('\n✅ Demo completed successfully!');
      console.log(`📊 Report saved: ${report.sessionId}`);
      console.log(`📸 Screenshots captured: ${this.testRunner.screenshots.length}`);
      
      return report;

    } catch (error) {
      console.error('❌ Demo failed:', error.message);
      throw error;
    } finally {
      // Clean up browser session
      if (this.testRunner.browserMCPPlaywright.isInitialized) {
        await this.testRunner.browserMCPPlaywright.close();
      }
    }
  }

  /**
   * Demonstrate login scenario with real browser automation
   */
  async demonstrateLoginScenario() {
    const ActionProcessors = require('./engine/action-processors.cjs');
    const processor = new ActionProcessors(this.testRunner);

    // Navigate to login page
    await processor.processNavigate({
      url: 'https://vrp-system-v4.pages.dev/auth/login'
    });

    // Take screenshot of login page
    await this.testRunner.takeScreenshot('login-page', 'Login page loaded');

    // Fill login form
    await processor.processFill({
      fields: {
        '#email': 'test@example.com',
        '#password': 'password123'
      }
    });

    // Submit login
    await processor.processClick({
      selector: '#login-button',
      waitFor: 'networkIdle'
    });

    // Verify login success
    await processor.processVerifyState({});

    // Take success screenshot
    await this.testRunner.takeScreenshot('login-success', 'Login completed successfully');
  }

  /**
   * Demonstrate CRUD operations with real browser automation
   */
  async demonstrateCRUDOperations() {
    const ActionProcessors = require('./engine/action-processors.cjs');
    const processor = new ActionProcessors(this.testRunner);

    // Navigate to projects page
    await processor.processNavigate({
      url: 'https://vrp-system-v4.pages.dev/projects'
    });

    // Take screenshot of projects dashboard
    await this.testRunner.takeScreenshot('projects-dashboard', 'Projects dashboard');

    // Create new project
    await processor.processClick({
      selector: '.create-project-button'
    });

    // Fill project details
    await processor.processFill({
      fields: {
        '#project-name': 'Demo Project',
        '#project-description': 'UAT Demo Project for testing'
      },
      submitSelector: '#save-project'
    });

    // Take screenshot of created project
    await this.testRunner.takeScreenshot('project-created', 'New project created');

    // Verify project appears in list
    await processor.processVerifyState({});
  }

  /**
   * Show how to use individual MCP Playwright tools
   */
  async demonstrateIndividualTools() {
    console.log('\n🔧 Demonstrating Individual MCP Playwright Tools');
    console.log('================================================');

    // Example of direct tool usage (how Claude Code would call them)
    try {
      // Navigate to application
      const navResult = await this.mcpPlaywrightTools.navigate({
        url: 'https://vrp-system-v4.pages.dev',
        browserType: 'chromium',
        headless: false,
        width: 1280,
        height: 720
      });
      console.log('✅ Navigation result:', navResult);

      // Take a screenshot
      const screenshotResult = await this.mcpPlaywrightTools.screenshot({
        name: 'application-loaded',
        fullPage: false,
        downloadsDir: '/mnt/c/projects/vrp-system/v4/uat/screenshots'
      });
      console.log('✅ Screenshot result:', screenshotResult);

      // Click an element
      const clickResult = await this.mcpPlaywrightTools.click({
        selector: '.login-button'
      });
      console.log('✅ Click result:', clickResult);

      // Fill a form field
      const fillResult = await this.mcpPlaywrightTools.fill({
        selector: '#email',
        value: 'user@example.com'
      });
      console.log('✅ Fill result:', fillResult);

      // Evaluate JavaScript
      const evalResult = await this.mcpPlaywrightTools.evaluate({
        script: 'document.title'
      });
      console.log('✅ Evaluate result:', evalResult);

      // Get page text
      const textResult = await this.mcpPlaywrightTools.getVisibleText();
      console.log('✅ Visible text result:', textResult);

      // Get console logs
      const logsResult = await this.mcpPlaywrightTools.getConsoleLogs({
        type: 'error',
        limit: 10
      });
      console.log('✅ Console logs result:', logsResult);

    } catch (error) {
      console.error('❌ Tool demonstration failed:', error.message);
    }
  }
}

// Main execution
async function main() {
  const demo = new RealBrowserAutomationDemo();
  
  try {
    // Run the full demo
    await demo.demonstrateRealBrowserAutomation();
    
    // Show individual tool usage
    await demo.demonstrateIndividualTools();
    
    console.log('\n🎉 All demonstrations completed successfully!');
    
  } catch (error) {
    console.error('❌ Demo execution failed:', error.message);
    process.exit(1);
  }
}

// Export for use as module or run directly
if (require.main === module) {
  main();
}

module.exports = RealBrowserAutomationDemo;