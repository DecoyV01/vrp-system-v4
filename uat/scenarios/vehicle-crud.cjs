// Vehicle CRUD Operations UAT Scenario
module.exports = {
  name: 'vehicle-crud',
  description: 'Test complete vehicle CRUD operations',
  timeout: 60000,
  preconditions: [
    'user must be logged in',
    'project must be selected'
  ],
  objectives: [
    {
      id: "vehicle_creation",
      title: "Vehicle Creation Functionality",
      description: "Verify users can successfully create new vehicles in the system",
      category: "CRUD Operations",
      priority: "Critical",
      acceptance_criteria: [
        "User can access vehicle creation form",
        "Form accepts valid vehicle data",
        "Form validation prevents invalid submissions",
        "Vehicle is successfully created and appears in list",
        "System provides confirmation of creation"
      ],
      steps: ["navigate_to_vehicles", "create_vehicle"],
      dependencies: []
    },
    {
      id: "vehicle_reading",
      title: "Vehicle Data Retrieval",
      description: "Verify users can view and read vehicle details",
      category: "CRUD Operations", 
      priority: "Critical",
      acceptance_criteria: [
        "Vehicle list displays correctly",
        "Individual vehicle details can be accessed",
        "Vehicle data is displayed accurately",
        "Navigation between list and detail views works"
      ],
      steps: ["navigate_to_vehicles", "read_vehicle"],
      dependencies: ["vehicle_creation"]
    },
    {
      id: "vehicle_updating",
      title: "Vehicle Data Modification",
      description: "Verify users can edit and update existing vehicle information",
      category: "CRUD Operations",
      priority: "Critical", 
      acceptance_criteria: [
        "Vehicle edit form can be accessed",
        "Form pre-populates with existing data",
        "Changes can be saved successfully",
        "Updated data is reflected immediately",
        "System provides update confirmation"
      ],
      steps: ["update_vehicle"],
      dependencies: ["vehicle_creation", "vehicle_reading"]
    },
    {
      id: "vehicle_deletion",
      title: "Vehicle Removal Functionality",
      description: "Verify users can safely delete vehicles from the system",
      category: "CRUD Operations",
      priority: "High",
      acceptance_criteria: [
        "Delete action requires confirmation",
        "Confirmation dialog displays correctly",
        "Vehicle is removed from system after confirmation",
        "Vehicle no longer appears in list",
        "System handles deletion gracefully"
      ],
      steps: ["delete_vehicle"],
      dependencies: ["vehicle_creation"]
    },
    {
      id: "data_validation",
      title: "Vehicle Data Validation",
      description: "Verify proper validation of vehicle data throughout CRUD operations",
      category: "Data Integrity",
      priority: "High",
      acceptance_criteria: [
        "Required fields are enforced",
        "Data types are validated",
        "Business rules are applied",
        "Error messages are clear and helpful",
        "Invalid data cannot be saved"
      ],
      steps: ["create_vehicle", "update_vehicle"],
      dependencies: []
    }
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