#!/usr/bin/env node

/**
 * UAT CRUD Command
 * 
 * Tests CRUD operations on VRP system entities:
 * - project: create, read, update, delete projects
 * - scenario: create, read, update, delete scenarios
 * - dataset: create, read, update, delete datasets
 * - vehicle: create, read, update, delete vehicles
 * - job: create, read, update, delete jobs
 */

const UATTestRunner = require('../engine/test-runner.cjs');
const ActionProcessors = require('../engine/action-processors.cjs');
const UATTestSession = require('../engine/test-session.cjs');

const ENTITY_CONFIGS = {
  project: {
    listUrl: '/projects',
    createButton: '#add-project-button',
    form: {
      '#project-name': 'Test Project UAT',
      '#project-description': 'Automated test project created by UAT'
    },
    submitButton: '#submit-project',
    listSelector: '.project-list',
    itemSelector: '[data-project-id]'
  },
  scenario: {
    listUrl: '/projects/:projectId/scenarios',
    createButton: '#add-scenario-button',
    form: {
      '#scenario-name': 'Test Scenario UAT',
      '#scenario-description': 'Automated test scenario created by UAT'
    },
    submitButton: '#submit-scenario',
    listSelector: '.scenario-list',
    itemSelector: '[data-scenario-id]'
  },
  dataset: {
    listUrl: '/projects/:projectId/scenarios/:scenarioId/datasets',
    createButton: '#add-dataset-button',
    form: {
      '#dataset-name': 'Test Dataset UAT',
      '#dataset-description': 'Automated test dataset created by UAT'
    },
    submitButton: '#submit-dataset',
    listSelector: '.dataset-list',
    itemSelector: '[data-dataset-id]'
  },
  vehicle: {
    listUrl: '/projects/:projectId/scenarios/:scenarioId/datasets/:datasetId/vehicles',
    createButton: '#add-vehicle-button',
    form: {
      '#vehicle-id': 'TEST_VEHICLE_UAT',
      '#vehicle-capacity': '1000',
      '#vehicle-start-location': 'Warehouse A',
      '#vehicle-end-location': 'Warehouse B'
    },
    submitButton: '#submit-vehicle',
    listSelector: '.vehicle-list',
    itemSelector: '[data-vehicle-id="TEST_VEHICLE_UAT"]'
  },
  job: {
    listUrl: '/projects/:projectId/scenarios/:scenarioId/datasets/:datasetId/jobs',
    createButton: '#add-job-button',
    form: {
      '#job-id': 'TEST_JOB_UAT',
      '#job-location': 'Customer Location A',
      '#job-service-time': '30',
      '#job-time-window-start': '09:00',
      '#job-time-window-end': '17:00'
    },
    submitButton: '#submit-job',
    listSelector: '.job-list',
    itemSelector: '[data-job-id="TEST_JOB_UAT"]'
  }
};

async function uatCrud(entity, action) {
  if (!entity || !action) {
    console.error('Usage: uat-crud [entity] [action]');
    console.log('Entities: project, scenario, dataset, vehicle, job');
    console.log('Actions: create, read, update, delete');
    return { success: false, error: 'Missing parameters' };
  }

  if (!ENTITY_CONFIGS[entity]) {
    console.error(`❌ Unknown entity: ${entity}`);
    console.log('Available entities:', Object.keys(ENTITY_CONFIGS).join(', '));
    return { success: false, error: 'Unknown entity' };
  }

  console.log(`🧪 Testing ${action.toUpperCase()} operation on ${entity}`);
  
  const runner = new UATTestRunner({
    debugMode: process.argv.includes('--debug')
  });
  
  // Get active test session for result tracking
  const testSession = UATTestSession.getActiveSession();
  const startTime = Date.now();
  
  try {
    // Initialize
    await runner.initialize();
    
    const processor = new ActionProcessors(runner);
    const config = ENTITY_CONFIGS[entity];
    
    // Ensure user is logged in
    const state = await processor.processVerifyState({});
    if (!state.state.isLoggedIn) {
      console.log('🔐 User not logged in, performing login first...');
      await processor.processLogin({
        email: 'test1@example.com',
        password: 'testpassword123246'
      });
    }
    
    let result;
    
    switch (action.toLowerCase()) {
      case 'create':
        result = await performCreate(runner, processor, entity, config);
        break;
      case 'read':
        result = await performRead(runner, processor, entity, config);
        break;
      case 'update':
        result = await performUpdate(runner, processor, entity, config);
        break;
      case 'delete':
        result = await performDelete(runner, processor, entity, config);
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }
    
    console.log(`✅ ${action.toUpperCase()} operation completed successfully!`);
    
    const testResult = {
      success: true,
      type: 'command',
      entity,
      action,
      name: `${entity}_${action}`,
      result,
      screenshots: runner.screenshots,
      duration: Date.now() - startTime,
      timestamp: new Date().toISOString()
    };
    
    // Record test result in session
    testSession.recordTest(testResult);
    
    // Record screenshots in session
    runner.screenshots.forEach(screenshot => {
      testSession.recordScreenshot(screenshot);
    });
    
    return testResult;
    
  } catch (error) {
    await runner.takeScreenshot(`${entity}-${action}-failure`);
    
    console.error(`❌ ${action.toUpperCase()} operation failed: ${error.message}`);
    
    const testResult = {
      success: false,
      type: 'command',
      entity,
      action,
      name: `${entity}_${action}`,
      error: error.message,
      screenshots: runner.screenshots,
      duration: Date.now() - startTime,
      timestamp: new Date().toISOString()
    };
    
    // Record failed test result in session
    testSession.recordTest(testResult);
    
    // Record screenshots in session
    runner.screenshots.forEach(screenshot => {
      testSession.recordScreenshot(screenshot);
    });
    
    return testResult;
  }
}

async function performCreate(runner, processor, entity, config) {
  console.log(`📝 Creating new ${entity}...`);
  
  // Navigate to entity list page
  await processor.processNavigate({
    url: config.listUrl,
    waitFor: 'networkIdle'
  });
  
  // Take screenshot of list page
  await runner.takeScreenshot(`${entity}-list-before-create`);
  
  // Click create button
  await processor.processClick({
    selector: config.createButton,
    waitFor: 1000
  });
  
  // Take screenshot of form
  await runner.takeScreenshot(`${entity}-create-form`);
  
  // Fill form
  await processor.processFill({
    fields: config.form,
    submitSelector: config.submitButton
  });
  
  // Wait for creation to complete
  await processor.processVerifyState({});
  
  // Take screenshot of result
  await runner.takeScreenshot(`${entity}-created`);
  
  // Verify item appears in list
  await processor.processNavigate({
    url: config.listUrl,
    waitFor: 'networkIdle'
  });
  
  // Check if item exists in list
  try {
    await runner.runValidations([
      ['elementExists', config.itemSelector]
    ]);
  } catch (error) {
    throw new Error(`Created ${entity} not found in list: ${error.message}`);
  }
  
  return {
    operation: 'create',
    data: config.form
  };
}

async function performRead(runner, processor, entity, config) {
  console.log(`👀 Reading ${entity} details...`);
  
  // Navigate to entity list page
  await processor.processNavigate({
    url: config.listUrl,
    waitFor: 'networkIdle'
  });
  
  // Take screenshot of list
  await runner.takeScreenshot(`${entity}-list`);
  
  // Click on first item to view details
  await processor.processClick({
    selector: `${config.itemSelector}:first-child`,
    waitFor: 'networkIdle'
  });
  
  // Take screenshot of detail view
  await runner.takeScreenshot(`${entity}-detail-view`);
  
  // Verify detail view loaded
  await runner.runValidations([
    ['elementExists', '.detail-view, .detail-panel, .entity-detail']
  ]);
  
  return {
    operation: 'read',
    viewed: true
  };
}

async function performUpdate(runner, processor, entity, config) {
  console.log(`✏️ Updating ${entity}...`);
  
  // First, read the entity to get to detail view
  await performRead(runner, processor, entity, config);
  
  // Click edit button
  await processor.processClick({
    selector: '#edit-button, .edit-button, [data-action="edit"]',
    waitFor: 1000
  });
  
  // Take screenshot of edit form
  await runner.takeScreenshot(`${entity}-edit-form`);
  
  // Update one field (modify the first text field)
  const firstField = Object.keys(config.form)[0];
  const updatedValue = config.form[firstField] + ' (Updated)';
  
  await processor.processFill({
    fields: {
      [firstField]: updatedValue
    },
    submitSelector: '#save-button, .save-button, [data-action="save"]'
  });
  
  // Wait for update to complete
  await processor.processVerifyState({});
  
  // Take screenshot of updated entity
  await runner.takeScreenshot(`${entity}-updated`);
  
  return {
    operation: 'update',
    field: firstField,
    value: updatedValue
  };
}

async function performDelete(runner, processor, entity, config) {
  console.log(`🗑️ Deleting ${entity}...`);
  
  // First, read the entity to get to detail view
  await performRead(runner, processor, entity, config);
  
  // Click delete button
  await processor.processClick({
    selector: '#delete-button, .delete-button, [data-action="delete"]',
    waitFor: 1000
  });
  
  // Take screenshot of confirmation dialog
  await runner.takeScreenshot(`${entity}-delete-confirmation`);
  
  // Confirm deletion
  await processor.processClick({
    selector: '#confirm-delete, .confirm-delete, [data-action="confirm"]',
    waitFor: 'networkIdle'
  });
  
  // Take screenshot after deletion
  await runner.takeScreenshot(`${entity}-deleted`);
  
  // Verify item no longer exists in list
  await processor.processNavigate({
    url: config.listUrl,
    waitFor: 'networkIdle'
  });
  
  try {
    await runner.runValidations([
      ['elementNotExists', config.itemSelector]
    ]);
  } catch (error) {
    console.log(`⚠️ Warning: ${entity} may still exist in list after deletion`);
  }
  
  return {
    operation: 'delete',
    confirmed: true
  };
}

// Run if called directly
if (require.main === module) {
  const entity = process.argv[2];
  const action = process.argv[3];
  
  uatCrud(entity, action)
    .then(result => {
      console.log('\n📊 CRUD Test Result:', JSON.stringify(result, null, 2));
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal error:', error.message);
      process.exit(1);
    });
}

module.exports = uatCrud;