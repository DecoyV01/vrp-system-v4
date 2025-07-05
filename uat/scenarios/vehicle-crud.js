// Vehicle CRUD Operations UAT Scenario
module.exports = {
  name: 'vehicle-crud',
  description: 'Test complete vehicle CRUD operations',
  timeout: 60000,
  preconditions: [
    'user must be logged in',
    'project must be selected'
  ],
  steps: [
    {
      action: 'navigate_to_vehicles',
      url: '/projects/:projectId/scenarios/:scenarioId/datasets/:datasetId/vehicles',
      validate: [
        ['elementVisible', '.vehicle-list'],
        ['healthCheck', 'getDataLoadState().vehicles', 'success']
      ]
    },
    {
      action: 'screenshot',
      name: 'vehicles-list-initial'
    },
    {
      action: 'create_vehicle',
      description: 'Test vehicle creation',
      steps: [
        {
          action: 'click',
          selector: '#add-vehicle-button',
          validate: ['elementVisible', '.vehicle-form-modal']
        },
        {
          action: 'fill',
          fields: {
            '#vehicle-id': 'TEST_VEHICLE_001',
            '#vehicle-capacity': '1000',
            '#vehicle-start-location': 'Warehouse A',
            '#vehicle-end-location': 'Warehouse B'
          },
          validate: [
            ['formIsValid', '.vehicle-form'],
            ['inputHasValue', '#vehicle-id', 'TEST_VEHICLE_001']
          ]
        },
        {
          action: 'screenshot',
          name: 'vehicle-form-filled'
        },
        {
          action: 'click',
          selector: '#submit-vehicle',
          waitFor: 'networkIdle'
        },
        {
          action: 'verify_creation',
          validate: [
            ['elementNotExists', '.vehicle-form-modal'],
            ['tableContainsText', '.vehicle-list', 'TEST_VEHICLE_001'],
            ['healthCheck', 'hasErrors', false]
          ]
        }
      ]
    },
    {
      action: 'screenshot',
      name: 'vehicle-created'
    },
    {
      action: 'read_vehicle',
      description: 'Test vehicle detail view',
      steps: [
        {
          action: 'click',
          selector: '[data-vehicle-id="TEST_VEHICLE_001"]',
          validate: ['elementVisible', '.vehicle-detail-view']
        },
        {
          action: 'verify_details',
          validate: [
            ['textContains', '.vehicle-id', 'TEST_VEHICLE_001'],
            ['textContains', '.vehicle-capacity', '1000']
          ]
        }
      ]
    },
    {
      action: 'update_vehicle',
      description: 'Test vehicle editing',
      steps: [
        {
          action: 'click',
          selector: '#edit-vehicle-button',
          validate: ['elementVisible', '.vehicle-edit-form']
        },
        {
          action: 'fill',
          fields: {
            '#vehicle-capacity': '1500'
          }
        },
        {
          action: 'click',
          selector: '#save-vehicle',
          waitFor: 'networkIdle'
        },
        {
          action: 'verify_update',
          validate: [
            ['textContains', '.vehicle-capacity', '1500'],
            ['healthCheck', 'hasErrors', false]
          ]
        }
      ]
    },
    {
      action: 'screenshot',
      name: 'vehicle-updated'
    },
    {
      action: 'delete_vehicle',
      description: 'Test vehicle deletion',
      steps: [
        {
          action: 'click',
          selector: '#delete-vehicle-button',
          validate: ['elementVisible', '.confirm-delete-modal']
        },
        {
          action: 'click',
          selector: '#confirm-delete',
          waitFor: 'networkIdle'
        },
        {
          action: 'verify_deletion',
          validate: [
            ['elementNotExists', '.confirm-delete-modal'],
            ['elementNotExists', '[data-vehicle-id="TEST_VEHICLE_001"]'],
            ['healthCheck', 'hasErrors', false]
          ]
        }
      ]
    },
    {
      action: 'screenshot',
      name: 'vehicle-deleted'
    }
  ]
};