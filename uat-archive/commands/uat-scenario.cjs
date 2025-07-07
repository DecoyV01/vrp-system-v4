#!/usr/bin/env node

/**
 * UAT Scenario Command
 * 
 * Executes predefined test scenarios from the scenarios directory.
 * Provides comprehensive testing of complete user workflows.
 */

const UATTestRunner = require('../engine/test-runner.cjs');
const fs = require('fs');
const path = require('path');

async function uatScenario(scenarioName) {
  if (!scenarioName) {
    console.error('Usage: uat-scenario [scenario-name]');
    console.log('');
    
    // List available scenarios
    const scenariosDir = '/mnt/c/projects/vrp-system/v4/uat/scenarios';
    try {
      const files = fs.readdirSync(scenariosDir)
        .filter(file => file.endsWith('.js'))
        .map(file => file.replace('.js', ''));
      
      console.log('Available scenarios:');
      files.forEach(file => {
        console.log(`  - ${file}`);
      });
    } catch (error) {
      console.log('Could not list scenarios:', error.message);
    }
    
    return { success: false, error: 'Missing scenario name' };
  }

  console.log(`🧪 Executing scenario: ${scenarioName}`);
  
  const runner = new UATTestRunner({
    debugMode: process.argv.includes('--debug')
  });
  
  try {
    // Initialize
    await runner.initialize();
    
    // Execute the scenario
    const result = await runner.executeScenario(scenarioName);
    
    console.log('✅ Scenario completed successfully!');
    console.log(`📊 Steps executed: ${result.steps}`);
    console.log(`⏱️ Duration: ${result.duration}ms`);
    console.log(`📸 Screenshots: ${result.screenshots.length}`);
    
    return result;
    
  } catch (error) {
    console.error(`❌ Scenario failed: ${error.message}`);
    
    // Provide troubleshooting tips
    console.log('');
    console.log('Troubleshooting:');
    console.log('1. Check the scenario definition file for syntax errors');
    console.log('2. Verify all required selectors exist in the application');
    console.log('3. Ensure preconditions are met before running the scenario');
    console.log('4. Review failure screenshots for visual clues');
    
    return {
      success: false,
      scenarioName,
      error: error.message,
      screenshots: runner.screenshots,
      timestamp: new Date().toISOString()
    };
  }
}

// Add scenario validation helper
async function validateScenario(scenarioName) {
  console.log(`🔍 Validating scenario: ${scenarioName}`);
  
  try {
    const scenarioPath = path.join('/mnt/c/projects/vrp-system/v4/uat/scenarios', `${scenarioName}.js`);
    
    if (!fs.existsSync(scenarioPath)) {
      throw new Error(`Scenario file not found: ${scenarioPath}`);
    }
    
    // Load and validate scenario structure
    const scenario = require(scenarioPath);
    
    // Check required properties
    if (!scenario.name) {
      console.warn('⚠️ Scenario missing name property');
    }
    
    if (!scenario.description) {
      console.warn('⚠️ Scenario missing description property');
    }
    
    if (!scenario.steps || !Array.isArray(scenario.steps)) {
      throw new Error('Scenario must have a steps array');
    }
    
    if (scenario.steps.length === 0) {
      throw new Error('Scenario must have at least one step');
    }
    
    // Validate objectives if present
    if (scenario.objectives && Array.isArray(scenario.objectives)) {
      scenario.objectives.forEach((objective, index) => {
        if (!objective.id) {
          throw new Error(`Objective ${index + 1} missing id property`);
        }
        
        if (!objective.title) {
          throw new Error(`Objective ${index + 1} missing title property`);
        }
        
        if (!objective.category) {
          throw new Error(`Objective ${index + 1} missing category property`);
        }
        
        const validCategories = ['Authentication', 'CRUD Operations', 'Error Handling', 'UI/UX', 'Data Integrity'];
        if (!validCategories.includes(objective.category)) {
          throw new Error(`Objective ${index + 1}: category must be one of: ${validCategories.join(', ')}`);
        }
        
        if (!objective.priority) {
          throw new Error(`Objective ${index + 1} missing priority property`);
        }
        
        const validPriorities = ['Critical', 'High', 'Medium', 'Low'];
        if (!validPriorities.includes(objective.priority)) {
          throw new Error(`Objective ${index + 1}: priority must be one of: ${validPriorities.join(', ')}`);
        }
        
        if (!objective.acceptance_criteria || !Array.isArray(objective.acceptance_criteria)) {
          throw new Error(`Objective ${index + 1} missing acceptance_criteria array`);
        }
        
        if (!objective.steps || !Array.isArray(objective.steps)) {
          throw new Error(`Objective ${index + 1} missing steps array`);
        }
        
        // Validate step references exist in scenario
        const stepActions = scenario.steps.map(s => s.action);
        objective.steps.forEach(stepRef => {
          if (!stepActions.includes(stepRef)) {
            console.warn(`⚠️ Objective ${objective.id}: referenced step '${stepRef}' not found in scenario steps`);
          }
        });
        
        // Validate dependency references exist in scenario
        if (objective.dependencies && Array.isArray(objective.dependencies)) {
          const objectiveIds = scenario.objectives.map(o => o.id);
          objective.dependencies.forEach(depId => {
            if (!objectiveIds.includes(depId)) {
              throw new Error(`Objective ${objective.id}: dependency '${depId}' not found in scenario objectives`);
            }
          });
        }
      });
    }
    
    // Validate each step
    scenario.steps.forEach((step, index) => {
      if (!step.action) {
        throw new Error(`Step ${index + 1} missing action property`);
      }
      
      // Validate action-specific requirements
      switch (step.action) {
        case 'navigate':
          if (!step.url) {
            throw new Error(`Step ${index + 1}: navigate action requires url property`);
          }
          break;
        case 'click':
          if (!step.selector) {
            throw new Error(`Step ${index + 1}: click action requires selector property`);
          }
          break;
        case 'fill':
          if (!step.fields || typeof step.fields !== 'object') {
            throw new Error(`Step ${index + 1}: fill action requires fields object`);
          }
          break;
        case 'custom_script':
          if (!step.script) {
            throw new Error(`Step ${index + 1}: custom_script action requires script property`);
          }
          break;
      }
      
      // Validate validation arrays
      if (step.validate && Array.isArray(step.validate)) {
        step.validate.forEach((validation, vIndex) => {
          if (!Array.isArray(validation) || validation.length < 1) {
            throw new Error(`Step ${index + 1}, validation ${vIndex + 1}: must be an array with at least one element`);
          }
        });
      }
    });
    
    console.log('✅ Scenario validation passed');
    console.log(`📋 Scenario: ${scenario.name || scenarioName}`);
    console.log(`📝 Description: ${scenario.description || 'No description'}`);
    console.log(`📊 Steps: ${scenario.steps.length}`);
    
    if (scenario.objectives && scenario.objectives.length > 0) {
      console.log(`🎯 Objectives: ${scenario.objectives.length}`);
      scenario.objectives.forEach((objective, index) => {
        console.log(`  ${index + 1}. ${objective.title} (${objective.priority} - ${objective.category})`);
        console.log(`     ${objective.description}`);
        console.log(`     Criteria: ${objective.acceptance_criteria.length}, Steps: ${objective.steps.length}`);
        if (objective.dependencies && objective.dependencies.length > 0) {
          console.log(`     Dependencies: ${objective.dependencies.join(', ')}`);
        }
      });
    }
    
    if (scenario.preconditions) {
      console.log(`⚠️ Preconditions: ${scenario.preconditions.length}`);
      scenario.preconditions.forEach((condition, index) => {
        console.log(`  ${index + 1}. ${condition}`);
      });
    }
    
    return { valid: true, scenario };
    
  } catch (error) {
    console.error(`❌ Scenario validation failed: ${error.message}`);
    return { valid: false, error: error.message };
  }
}

// Dry run helper
async function dryRunScenario(scenarioName) {
  console.log(`🏃‍♂️ Dry run for scenario: ${scenarioName}`);
  
  const validation = await validateScenario(scenarioName);
  if (!validation.valid) {
    return validation;
  }
  
  const { scenario } = validation;
  
  console.log('');
  console.log('Dry run execution plan:');
  console.log('='.repeat(50));
  
  scenario.steps.forEach((step, index) => {
    console.log(`Step ${index + 1}: ${step.action.toUpperCase()}`);
    
    if (step.description) {
      console.log(`  Description: ${step.description}`);
    }
    
    switch (step.action) {
      case 'navigate':
        console.log(`  URL: ${step.url}`);
        break;
      case 'click':
        console.log(`  Selector: ${step.selector}`);
        break;
      case 'fill':
        console.log(`  Fields: ${Object.keys(step.fields).join(', ')}`);
        break;
      case 'custom_script':
        console.log(`  Script: ${step.script.substring(0, 100)}...`);
        break;
    }
    
    if (step.validate) {
      console.log(`  Validations: ${step.validate.length}`);
      step.validate.forEach((validation, vIndex) => {
        console.log(`    ${vIndex + 1}. ${validation[0]}(${validation.slice(1).join(', ')})`);
      });
    }
    
    console.log('');
  });
  
  console.log('✅ Dry run completed - scenario appears valid');
  
  return { dryRun: true, valid: true };
}

// Run if called directly
if (require.main === module) {
  const scenarioName = process.argv[2];
  const isDryRun = process.argv.includes('--dry-run');
  const isValidateOnly = process.argv.includes('--validate');
  
  let operation;
  
  if (isValidateOnly) {
    operation = validateScenario(scenarioName);
  } else if (isDryRun) {
    operation = dryRunScenario(scenarioName);
  } else {
    operation = uatScenario(scenarioName);
  }
  
  operation
    .then(result => {
      if (!isValidateOnly && !isDryRun) {
        console.log('\n📊 Scenario Result:', JSON.stringify(result, null, 2));
      }
      
      const success = result.success !== false && result.valid !== false;
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal error:', error.message);
      process.exit(1);
    });
}

module.exports = { uatScenario, validateScenario, dryRunScenario };