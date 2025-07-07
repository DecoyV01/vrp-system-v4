#!/usr/bin/env node

/**
 * UAT Init Command
 * 
 * Initializes the UAT testing environment by:
 * 1. Navigating to the application
 * 2. Injecting validation framework
 * 3. Verifying health check system
 * 4. Taking baseline screenshot
 */

const UATTestRunner = require('../engine/test-runner.cjs');
const { getValidationFramework } = require('../engine/validation-framework.cjs');

async function uatInit() {
  console.log('🚀 Initializing UAT environment...');
  
  const runner = new UATTestRunner({
    debugMode: process.argv.includes('--debug')
  });
  
  try {
    // Initialize the test runner
    await runner.initialize();
    
    console.log('🎉 UAT environment ready!');
    console.log('');
    console.log('Available commands:');
    console.log('  /uat-login [email] [password]   - Test login functionality');
    console.log('  /uat-crud [entity] [action]     - Test CRUD operations');
    console.log('  /uat-scenario [scenario-name]   - Run predefined scenarios');
    console.log('  /uat-report                     - Generate test report');
    console.log('');
    console.log('Health check system:', runner.validationFrameworkInjected ? '✅ Active' : '⚠️ Limited');
    
    return {
      success: true,
      sessionId: runner.sessionId,
      healthCheckAvailable: runner.validationFrameworkInjected
    };
    
  } catch (error) {
    console.error(`❌ UAT initialization failed: ${error.message}`);
    
    // Try to provide helpful troubleshooting
    console.log('');
    console.log('Troubleshooting tips:');
    console.log('1. Ensure the frontend is available at https://vrp-system-v4.pages.dev/');
    console.log('2. Check that Browser MCP is properly configured');
    console.log('3. Verify the application is in development mode');
    console.log('4. Try running with --debug flag for more details');
    
    return {
      success: false,
      error: error.message
    };
  }
}

// Run if called directly
if (require.main === module) {
  uatInit()
    .then(result => {
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal error:', error.message);
      process.exit(1);
    });
}

module.exports = uatInit;