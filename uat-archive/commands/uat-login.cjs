#!/usr/bin/env node

/**
 * UAT Login Command
 * 
 * Tests the complete login flow with validation:
 * 1. Verify logged out state
 * 2. Navigate to login page
 * 3. Fill and submit login form
 * 4. Verify successful authentication
 * 5. Take screenshots for documentation
 */

const UATTestRunner = require('../engine/test-runner.cjs');
const ActionProcessors = require('../engine/action-processors.cjs');

async function uatLogin(email = 'test1@example.com', password = 'testpassword123246') {
  console.log(`🔐 Testing login flow for: ${email}`);
  
  const runner = new UATTestRunner({
    debugMode: process.argv.includes('--debug')
  });
  
  try {
    // Initialize if not already done
    await runner.initialize();
    
    const processor = new ActionProcessors(runner);
    
    // Step 1: Verify initial state
    console.log('📋 Step 1: Verifying initial state...');
    const initialState = await processor.processVerifyState({});
    
    if (initialState.state.isLoggedIn) {
      console.log('ℹ️ User already logged in, logging out first...');
      await processor.processLogout({});
    }
    
    // Step 2: Navigate to login page
    console.log('📋 Step 2: Navigating to login page...');
    await processor.processNavigate({
      url: '/auth/login',
      waitFor: 'networkIdle'
    });
    
    // Step 3: Take login page screenshot
    await runner.takeScreenshot('login-page', 'Login page loaded');
    
    // Step 4: Fill login form
    console.log('📋 Step 3: Filling login form...');
    await processor.processFill({
      fields: {
        '#email': email,
        '#password': password
      }
    });
    
    // Step 5: Submit login form
    console.log('📋 Step 4: Submitting login form...');
    await processor.processClick({
      selector: '#login-button',
      waitFor: 'networkIdle'
    });
    
    // Step 6: Verify login success
    console.log('📋 Step 5: Verifying login success...');
    const finalState = await processor.processVerifyState({});
    
    if (!finalState.state.isLoggedIn) {
      throw new Error('Login failed - user not authenticated after form submission');
    }
    
    if (finalState.state.hasErrors) {
      const errors = await processor.checkForErrors();
      throw new Error(`Login completed but errors detected: ${errors.join(', ')}`);
    }
    
    // Step 7: Take success screenshot
    await runner.takeScreenshot('login-success', 'Login completed successfully');
    
    // Generate mini-report for this test
    const report = {
      test: 'login-flow',
      email,
      status: 'passed',
      duration: Date.now() - runner.sessionId,
      finalRoute: finalState.state.currentRoute,
      screenshots: runner.screenshots.slice(-3), // Last 3 screenshots
      timestamp: new Date().toISOString()
    };
    
    console.log('✅ Login test completed successfully!');
    console.log(`📍 User logged in and redirected to: ${finalState.state.currentRoute}`);
    console.log(`📸 Screenshots captured: ${runner.screenshots.length}`);
    
    return report;
    
  } catch (error) {
    // Take failure screenshot
    await runner.takeScreenshot('login-failure', `Login test failed: ${error.message}`);
    
    console.error(`❌ Login test failed: ${error.message}`);
    
    // Provide troubleshooting information
    console.log('');
    console.log('Troubleshooting:');
    console.log('1. Check if the login form elements exist (#email, #password, #login-button)');
    console.log('2. Verify the test credentials are correct');
    console.log('3. Check for form validation errors');
    console.log('4. Review the failure screenshot for visual clues');
    
    const report = {
      test: 'login-flow',
      email,
      status: 'failed',
      error: error.message,
      screenshots: runner.screenshots,
      timestamp: new Date().toISOString()
    };
    
    return report;
  }
}

// Run if called directly
if (require.main === module) {
  const email = process.argv[2];
  const password = process.argv[3];
  
  uatLogin(email, password)
    .then(result => {
      console.log('\n📊 Test Result:', JSON.stringify(result, null, 2));
      process.exit(result.status === 'passed' ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal error:', error.message);
      process.exit(1);
    });
}

module.exports = uatLogin;