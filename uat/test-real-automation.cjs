#!/usr/bin/env node

/**
 * Test Real Browser Automation
 * 
 * This script demonstrates actual usage of MCP Playwright tools for real browser automation.
 * Run this script when you have access to the real mcp__playwright tools.
 */

const UATTestRunner = require('./engine/test-runner.cjs');
const path = require('path');
const fs = require('fs');

async function testRealBrowserAutomation() {
  console.log('🚀 Testing Real Browser Automation with MCP Playwright');
  console.log('====================================================');

  // Initialize test runner with real browser automation
  const testRunner = new UATTestRunner({
    baseUrl: 'https://vrp-system-v4.pages.dev',
    useMCPPlaywright: true,
    debugMode: true,
    screenshotDir: '/mnt/c/projects/vrp-system/v4/uat/screenshots',
    timeout: 30000
  });

  try {
    console.log('\n📋 Step 1: Check MCP Playwright tool availability...');
    
    // In actual usage, Claude Code would inject these tools
    // For now, we'll check if they're available in the global context
    const mcpTools = {
      navigate: global.mcp__playwright__playwright_navigate,
      click: global.mcp__playwright__playwright_click,
      fill: global.mcp__playwright__playwright_fill,
      screenshot: global.mcp__playwright__playwright_screenshot,
      evaluate: global.mcp__playwright__playwright_evaluate,
      getVisibleText: global.mcp__playwright__playwright_get_visible_text,
      getVisibleHtml: global.mcp__playwright__playwright_get_visible_html,
      pressKey: global.mcp__playwright__playwright_press_key,
      close: global.mcp__playwright__playwright_close,
      getConsoleLogs: global.mcp__playwright__playwright_console_logs
    };

    // Check tool availability
    const availableTools = Object.entries(mcpTools)
      .filter(([name, tool]) => typeof tool === 'function')
      .map(([name]) => name);

    if (availableTools.length === 0) {
      console.log('⚠️ MCP Playwright tools not available in this context');
      console.log('💡 This script should be run by Claude Code with MCP tools available');
      console.log('\n🔧 Available actions:');
      console.log('1. Claude Code can inject the real MCP tools');
      console.log('2. Run the demo script instead: node demo-real-browser-automation.cjs');
      return false;
    }

    console.log(`✅ Found ${availableTools.length} MCP Playwright tools:`);
    availableTools.forEach(tool => console.log(`   - ${tool}`));

    // Configure test runner with real tools
    testRunner.setMCPPlaywrightTools(mcpTools);

    console.log('\n🌐 Step 2: Initialize browser session...');
    await testRunner.initialize();

    console.log('\n📱 Step 3: Navigate to VRP System application...');
    const navigationResult = await testRunner.navigateWithMCP(
      'https://vrp-system-v4.pages.dev',
      'networkIdle'
    );
    console.log('✅ Navigation completed:', navigationResult);

    console.log('\n📸 Step 4: Capture baseline screenshot...');
    const baselineScreenshot = await testRunner.takeScreenshot(
      'baseline-real-browser',
      'Initial application state captured with real browser'
    );
    console.log('✅ Baseline screenshot saved:', baselineScreenshot);

    console.log('\n🔍 Step 5: Extract page content...');
    if (testRunner.browserMCPPlaywright.isInitialized) {
      const pageText = await testRunner.browserMCPPlaywright.getVisibleText();
      console.log('📄 Page text preview:', pageText.substring(0, 200) + '...');

      const pageHtml = await testRunner.browserMCPPlaywright.getVisibleHtml({
        cleanHtml: true,
        removeScripts: true,
        maxLength: 1000
      });
      console.log('📝 Page HTML preview:', pageHtml.substring(0, 200) + '...');
    }

    console.log('\n⚙️ Step 6: Execute JavaScript evaluation...');
    if (testRunner.browserMCPPlaywright.isInitialized) {
      const titleResult = await testRunner.browserMCPPlaywright.evaluateScript(
        'document.title'
      );
      console.log('📋 Page title:', titleResult.result);

      const urlResult = await testRunner.browserMCPPlaywright.evaluateScript(
        'window.location.href'
      );
      console.log('🔗 Current URL:', urlResult.result);
    }

    console.log('\n🎯 Step 7: Test element interactions...');
    // Test if login elements exist
    if (testRunner.browserMCPPlaywright.isInitialized) {
      const hasLoginButton = await testRunner.browserMCPPlaywright.elementExists('.login-button');
      const hasAuthLink = await testRunner.browserMCPPlaywright.elementExists('a[href*="auth"]');
      
      console.log('🔍 Element detection:');
      console.log(`   Login button: ${hasLoginButton ? '✅ Found' : '❌ Not found'}`);
      console.log(`   Auth link: ${hasAuthLink ? '✅ Found' : '❌ Not found'}`);
    }

    console.log('\n📊 Step 8: Check for JavaScript errors...');
    if (testRunner.browserMCPPlaywright.isInitialized) {
      const errors = await testRunner.browserMCPPlaywright.checkForErrors();
      if (errors.length === 0) {
        console.log('✅ No JavaScript errors detected');
      } else {
        console.log(`⚠️ Found ${errors.length} errors:`, errors);
      }

      const consoleLogs = await testRunner.browserMCPPlaywright.getConsoleLogs({
        type: 'all',
        limit: 5
      });
      console.log('📋 Recent console logs:', consoleLogs);
    }

    console.log('\n📸 Step 9: Capture final screenshot...');
    const finalScreenshot = await testRunner.takeScreenshot(
      'final-real-browser',
      'Final application state after testing'
    );
    console.log('✅ Final screenshot saved:', finalScreenshot);

    console.log('\n📄 Step 10: Generate test report...');
    const report = testRunner.generateReport();
    console.log('📊 Test report generated:', `report-${report.sessionId}.json`);

    console.log('\n🎉 Real browser automation test completed successfully!');
    console.log('====================================================');
    console.log(`📸 Screenshots captured: ${testRunner.screenshots.length}`);
    console.log(`⏱️ Total session time: ${Date.now() - parseInt(report.sessionId.split('-')[1])}ms`);
    console.log(`📁 Screenshot directory: ${testRunner.options.screenshotDir}`);

    // List generated files
    const screenshotDir = testRunner.options.screenshotDir;
    if (fs.existsSync(screenshotDir)) {
      const files = fs.readdirSync(screenshotDir)
        .filter(file => file.includes(report.sessionId))
        .sort();
      
      console.log('\n📁 Generated files:');
      files.forEach(file => {
        const filePath = path.join(screenshotDir, file);
        const stats = fs.statSync(filePath);
        console.log(`   📸 ${file} (${stats.size} bytes)`);
      });
    }

    return true;

  } catch (error) {
    console.error('❌ Real browser automation test failed:', error.message);
    console.error('Stack trace:', error.stack);
    
    // Try to capture failure screenshot
    try {
      await testRunner.takeScreenshot('test-failure', 'Test execution failed');
    } catch (screenshotError) {
      console.error('❌ Could not capture failure screenshot:', screenshotError.message);
    }
    
    return false;
  } finally {
    // Clean up browser session
    try {
      if (testRunner.browserMCPPlaywright && testRunner.browserMCPPlaywright.isInitialized) {
        console.log('\n🔚 Closing browser session...');
        await testRunner.browserMCPPlaywright.close();
        console.log('✅ Browser session closed');
      }
    } catch (closeError) {
      console.error('⚠️ Error closing browser session:', closeError.message);
    }
  }
}

/**
 * Test specific UAT scenario with real browser automation
 */
async function testUATScenario(scenarioName = 'login-flow') {
  console.log(`\n🧪 Testing UAT Scenario: ${scenarioName}`);
  console.log('=====================================');

  const testRunner = new UATTestRunner({
    baseUrl: 'https://vrp-system-v4.pages.dev',
    useMCPPlaywright: true,
    debugMode: true
  });

  try {
    // Check if MCP tools are available
    const mcpTools = {
      navigate: global.mcp__playwright__playwright_navigate,
      click: global.mcp__playwright__playwright_click,
      fill: global.mcp__playwright__playwright_fill,
      screenshot: global.mcp__playwright__playwright_screenshot,
      evaluate: global.mcp__playwright__playwright_evaluate,
      getVisibleText: global.mcp__playwright__playwright_get_visible_text,
      getVisibleHtml: global.mcp__playwright__playwright_get_visible_html,
      pressKey: global.mcp__playwright__playwright_press_key,
      close: global.mcp__playwright__playwright_close,
      getConsoleLogs: global.mcp__playwright__playwright_console_logs
    };

    const hasTools = Object.values(mcpTools).some(tool => typeof tool === 'function');
    
    if (!hasTools) {
      console.log('⚠️ MCP Playwright tools not available - using fallback mode');
    } else {
      testRunner.setMCPPlaywrightTools(mcpTools);
      console.log('✅ MCP Playwright tools configured');
    }

    // Initialize and run scenario
    await testRunner.initialize();
    const result = await testRunner.executeScenario(scenarioName);
    
    console.log('✅ Scenario completed successfully:', result);
    return result;

  } catch (error) {
    console.error(`❌ Scenario ${scenarioName} failed:`, error.message);
    return null;
  } finally {
    if (testRunner.browserMCPPlaywright && testRunner.browserMCPPlaywright.isInitialized) {
      await testRunner.browserMCPPlaywright.close();
    }
  }
}

/**
 * Main execution function
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'test';
  const scenarioName = args[1] || 'login-flow';

  switch (command) {
    case 'test':
      await testRealBrowserAutomation();
      break;
    
    case 'scenario':
      await testUATScenario(scenarioName);
      break;
    
    case 'help':
      console.log('Usage:');
      console.log('  node test-real-automation.cjs test          # Run full browser automation test');
      console.log('  node test-real-automation.cjs scenario      # Run UAT scenario (default: login-flow)');
      console.log('  node test-real-automation.cjs scenario SCENARIO_NAME # Run specific scenario');
      console.log('  node test-real-automation.cjs help          # Show this help');
      break;
    
    default:
      console.error('Unknown command:', command);
      console.log('Run with "help" for usage information');
      process.exit(1);
  }
}

// Export for use as module or run directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Execution failed:', error.message);
    process.exit(1);
  });
}

module.exports = {
  testRealBrowserAutomation,
  testUATScenario
};