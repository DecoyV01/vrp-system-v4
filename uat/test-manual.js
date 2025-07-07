#!/usr/bin/env node

/**
 * Manual UAT Test - Direct execution for testing without hooks
 * Run: node test-manual.js login-flow
 */

import { UATRunner } from './uat-runner.js';

async function manualTest() {
    const runner = new UATRunner();
    const scenarioName = process.argv[2] || 'login-flow';
    
    console.log('🧪 Manual UAT Test');
    console.log('==================');
    console.log(`Testing scenario: ${scenarioName}`);
    console.log('');
    
    try {
        const executionPlan = await runner.runScenario(scenarioName);
        
        console.log('');
        console.log('✅ Manual test completed successfully!');
        console.log(`Generated execution plan with ${executionPlan.steps.length} steps`);
        console.log('');
        console.log('🎯 Next: Copy and execute each MCP function call shown above');
        
    } catch (error) {
        console.error('❌ Manual test failed:', error.message);
        process.exit(1);
    }
}

manualTest();