// bulk-editing.cjs - Comprehensive bulk editing functionality testing for table editor

module.exports = {
  name: 'bulk-editing',
  description: 'Test comprehensive bulk editing functionality including multi-row selection, field operations, and undo/redo',
  timeout: 60000,
  preconditions: [
    'user must be logged in',
    'project with dataset containing vehicles/jobs/locations must be selected',
    'table editor page must be accessible with existing data'
  ],
  objectives: [
    {
      id: "multi_row_selection",
      title: "Multi-Row Selection Interface",
      description: "Verify users can select multiple rows efficiently using various selection methods",
      category: "UI/UX",
      priority: "Critical",
      acceptance_criteria: [
        "User can select individual rows using checkboxes",
        "Select all/none functionality works correctly", 
        "Shift-click range selection works for contiguous rows",
        "Ctrl/Cmd-click allows non-contiguous selection",
        "Selection state is visually clear and persistent",
        "Selection count is displayed accurately",
        "Selection persists during pagination and filtering"
      ],
      steps: ["navigate", "test_individual_selection", "test_range_selection", "test_select_all"],
      dependencies: []
    },
    {
      id: "bulk_field_operations",
      title: "Bulk Field Editing Operations", 
      description: "Verify comprehensive bulk editing operations for different field types and data scenarios",
      category: "CRUD Operations",
      priority: "Critical",
      acceptance_criteria: [
        "Set operation updates selected records with new values",
        "Clear operation removes values from specified fields",
        "Increment/multiply operations work for numeric fields",
        "Copy operation transfers values between fields",
        "Formula operations calculate values correctly",
        "Conditional operations apply only to matching records",
        "Mixed field type operations handle validation properly"
      ],
      steps: ["select_records", "test_set_operation", "test_clear_operation", "test_numeric_operations", "test_copy_operation"],
      dependencies: ["multi_row_selection"]
    },
    {
      id: "preview_and_validation",
      title: "Edit Preview and Validation",
      description: "Verify users can preview changes and validate operations before applying",
      category: "Data Integrity",
      priority: "Critical", 
      acceptance_criteria: [
        "Preview shows exact changes for each affected record",
        "Validation catches business rule violations before applying",
        "Preview highlights potential data conflicts",
        "Users can modify operations based on preview feedback",
        "Validation error messages are specific and actionable",
        "Preview performance is acceptable for large selections"
      ],
      steps: ["configure_operation", "review_preview", "test_validation", "modify_operation"],
      dependencies: ["bulk_field_operations"]
    },
    {
      id: "undo_redo_functionality",
      title: "Undo/Redo Operations",
      description: "Verify robust undo/redo functionality for bulk editing operations",
      category: "UI/UX",
      priority: "High",
      acceptance_criteria: [
        "Undo reverses bulk operations completely and accurately",
        "Redo reapplies operations after undo",
        "Undo stack maintains operation history",
        "Undo descriptions are clear and helpful",
        "Undo works correctly for complex multi-field operations",
        "Real-time data conflicts are handled during undo/redo"
      ],
      steps: ["execute_operation", "test_undo", "test_redo", "test_undo_stack"],
      dependencies: ["bulk_field_operations"]
    },
    {
      id: "conditional_editing",
      title: "Conditional Bulk Editing",
      description: "Verify conditional operations that apply changes only to records meeting specific criteria",
      category: "CRUD Operations", 
      priority: "Medium",
      acceptance_criteria: [
        "Condition builder interface allows complex criteria definition",
        "Conditional operations apply only to matching records",
        "Multiple conditions with AND/OR logic work correctly",
        "Field-based conditions support various operators",
        "Preview accurately shows which records will be affected",
        "Validation prevents invalid conditional logic"
      ],
      steps: ["configure_conditions", "test_conditional_operations", "verify_selective_application"],
      dependencies: ["bulk_field_operations"]
    },
    {
      id: "performance_large_selections",
      title: "Large Selection Performance",
      description: "Verify bulk editing performance with large numbers of selected records",
      category: "UI/UX",
      priority: "Medium",
      acceptance_criteria: [
        "Selection of 1000+ records remains responsive",
        "Preview generation completes within reasonable time",
        "Bulk operations execute efficiently on large selections",
        "Progress indicators provide feedback for long operations",
        "Memory usage remains reasonable during bulk operations",
        "UI remains responsive during processing"
      ],
      steps: ["select_large_set", "test_large_preview", "execute_large_operation"],
      dependencies: ["multi_row_selection"]
    },
    {
      id: "error_handling_recovery",
      title: "Bulk Edit Error Handling",
      description: "Verify robust error handling and recovery during bulk editing operations",
      category: "Error Handling",
      priority: "High",
      acceptance_criteria: [
        "Network failures during bulk operations are handled gracefully",
        "Partial operation failures allow retry of failed records",
        "Validation errors prevent invalid bulk operations",
        "Concurrent data changes are detected and handled",
        "Users can abort long-running operations safely",
        "Error states provide clear recovery options"
      ],
      steps: ["test_network_failure", "test_validation_errors", "test_concurrent_changes"],
      dependencies: []
    }
  ],
  steps: [
    // Step 1: Navigate to table editor with existing data
    {
      action: 'navigate',
      url: '/projects/test-project/datasets/test-dataset/vehicles',
      validate: [
        ['urlMatches', '/vehicles'],
        ['elementVisible', '.table-editor-container'],
        ['healthCheck', 'getDataLoadState().vehicles', 'success'],
        ['tableRowCount', '.data-table tbody tr', 10] // Expect at least 10 records for testing
      ]
    },

    // Step 2: Test individual row selection
    {
      action: 'click',
      selector: '.data-table tbody tr:first-child .row-checkbox',
      validate: [
        ['hasClass', '.data-table tbody tr:first-child', 'selected'],
        ['textContains', '.selection-count', '1 selected']
      ]
    },

    {
      action: 'click', 
      selector: '.data-table tbody tr:nth-child(3) .row-checkbox',
      validate: [
        ['hasClass', '.data-table tbody tr:nth-child(3)', 'selected'],
        ['textContains', '.selection-count', '2 selected']
      ]
    },

    // Step 3: Test select all functionality
    {
      action: 'click',
      selector: '.table-header .select-all-checkbox',
      validate: [
        ['hasClass', '.table-header .select-all-checkbox', 'checked'],
        ['textContains', '.selection-count', '10 selected'], // All visible rows
        ['elementVisible', '.bulk-edit-toolbar']
      ]
    },

    {
      action: 'screenshot',
      name: 'all-rows-selected'
    },

    // Step 4: Test range selection (deselect all first, then test range)
    {
      action: 'click',
      selector: '.table-header .select-all-checkbox', // Deselect all
      validate: [
        ['textContains', '.selection-count', '0 selected']
      ]
    },

    {
      action: 'click',
      selector: '.data-table tbody tr:nth-child(2) .row-checkbox',
      validate: [
        ['textContains', '.selection-count', '1 selected']
      ]
    },

    {
      action: 'shift_click',
      selector: '.data-table tbody tr:nth-child(5) .row-checkbox',
      validate: [
        ['textContains', '.selection-count', '4 selected'], // Range selection: rows 2-5
        ['elementVisible', '.bulk-edit-toolbar']
      ]
    },

    // Step 5: Access bulk editing interface
    {
      action: 'click',
      selector: '[data-testid="bulk-edit-button"]',
      validate: [
        ['elementVisible', '.bulk-edit-modal'],
        ['elementVisible', '.field-selector'],
        ['elementVisible', '.operation-selector']
      ]
    },

    // Step 6: Test SET operation
    {
      action: 'click',
      selector: '[data-field="description"]',
      validate: [
        ['hasClass', '[data-field="description"]', 'selected']
      ]
    },

    {
      action: 'click',
      selector: '[data-operation="set"]',
      validate: [
        ['elementVisible', '.operation-value-input']
      ]
    },

    {
      action: 'fill',
      fields: {
        '.operation-value-input': 'Bulk Updated Vehicle'
      },
      validate: [
        ['inputHasValue', '.operation-value-input', 'Bulk Updated Vehicle']
      ]
    },

    // Step 7: Preview changes
    {
      action: 'click',
      selector: '[data-testid="preview-changes-button"]',
      waitFor: 'networkIdle',
      validate: [
        ['elementVisible', '.change-preview'],
        ['elementVisible', '.preview-table'],
        ['textContains', '.affected-records-count', '4 records will be updated']
      ]
    },

    {
      action: 'screenshot',
      name: 'bulk-edit-preview'
    },

    // Step 8: Execute bulk edit operation
    {
      action: 'click',
      selector: '[data-testid="apply-changes-button"]',
      waitFor: 'networkIdle',
      validate: [
        ['elementVisible', '.operation-success'],
        ['textContains', '.success-message', 'successfully updated'],
        ['healthCheck', 'hasErrors', false]
      ]
    },

    // Step 9: Verify changes in table
    {
      action: 'click',
      selector: '[data-testid="close-bulk-edit-modal"]',
      validate: [
        ['elementNotExists', '.bulk-edit-modal']
      ]
    },

    {
      action: 'verify_state',
      validate: [
        ['textContains', '.data-table tbody tr:nth-child(2) .description-cell', 'Bulk Updated Vehicle'],
        ['textContains', '.data-table tbody tr:nth-child(3) .description-cell', 'Bulk Updated Vehicle']
      ]
    },

    // Step 10: Test UNDO functionality
    {
      action: 'click',
      selector: '[data-testid="undo-button"]',
      waitFor: 'networkIdle',
      validate: [
        ['elementVisible', '.undo-confirmation'],
        ['textContains', '.undo-description', 'Undo bulk edit: Set description']
      ]
    },

    {
      action: 'click',
      selector: '[data-testid="confirm-undo"]',
      waitFor: 'networkIdle',
      validate: [
        ['elementVisible', '.undo-success'],
        ['healthCheck', 'hasErrors', false]
      ]
    },

    // Step 11: Verify undo worked
    {
      action: 'verify_state',
      validate: [
        ['elementNotExists', '.undo-confirmation'],
        ['elementExists', '[data-testid="redo-button"]'] // Redo should now be available
      ]
    },

    // Step 12: Test CLEAR operation
    {
      action: 'click',
      selector: '.data-table tbody tr:first-child .row-checkbox',
      validate: [
        ['textContains', '.selection-count', '1 selected']
      ]
    },

    {
      action: 'click',
      selector: '[data-testid="bulk-edit-button"]',
      validate: [
        ['elementVisible', '.bulk-edit-modal']
      ]
    },

    {
      action: 'click',
      selector: '[data-field="notes"]', // Assuming notes is an optional field
      validate: [
        ['hasClass', '[data-field="notes"]', 'selected']
      ]
    },

    {
      action: 'click',
      selector: '[data-operation="clear"]',
      validate: [
        ['elementNotExists', '.operation-value-input'] // Clear operation doesn't need value input
      ]
    },

    {
      action: 'click',
      selector: '[data-testid="apply-changes-button"]',
      waitFor: 'networkIdle',
      validate: [
        ['elementVisible', '.operation-success']
      ]
    },

    // Step 13: Test numeric INCREMENT operation
    {
      action: 'click',
      selector: '[data-testid="close-bulk-edit-modal"]'
    },

    {
      action: 'click',
      selector: '.data-table tbody tr:nth-child(2) .row-checkbox',
      validate: [
        ['textContains', '.selection-count', '1 selected']
      ]
    },

    {
      action: 'click',
      selector: '[data-testid="bulk-edit-button"]',
      validate: [
        ['elementVisible', '.bulk-edit-modal']
      ]
    },

    {
      action: 'click',
      selector: '[data-field="maxTasks"]', // Numeric field
      validate: [
        ['hasClass', '[data-field="maxTasks"]', 'selected']
      ]
    },

    {
      action: 'click',
      selector: '[data-operation="increment"]',
      validate: [
        ['elementVisible', '.operation-value-input']
      ]
    },

    {
      action: 'fill',
      fields: {
        '.operation-value-input': '5'
      },
      validate: [
        ['inputHasValue', '.operation-value-input', '5']
      ]
    },

    {
      action: 'click',
      selector: '[data-testid="apply-changes-button"]',
      waitFor: 'networkIdle',
      validate: [
        ['elementVisible', '.operation-success']
      ]
    },

    // Step 14: Test conditional operations
    {
      action: 'click',
      selector: '[data-testid="close-bulk-edit-modal"]'
    },

    {
      action: 'click',
      selector: '.table-header .select-all-checkbox', // Select all for conditional test
      validate: [
        ['elementVisible', '.bulk-edit-toolbar']
      ]
    },

    {
      action: 'click',
      selector: '[data-testid="bulk-edit-button"]',
      validate: [
        ['elementVisible', '.bulk-edit-modal']
      ]
    },

    {
      action: 'click',
      selector: '[data-testid="add-condition-button"]',
      validate: [
        ['elementVisible', '.condition-builder'],
        ['elementVisible', '.condition-field-selector']
      ]
    },

    {
      action: 'click',
      selector: '[data-condition-field="profile"]',
      validate: [
        ['elementVisible', '.condition-operator-selector']
      ]
    },

    {
      action: 'click',
      selector: '[data-operator="equals"]',
      validate: [
        ['elementVisible', '.condition-value-input']
      ]
    },

    {
      action: 'fill',
      fields: {
        '.condition-value-input': 'truck'
      },
      validate: [
        ['inputHasValue', '.condition-value-input', 'truck']
      ]
    },

    {
      action: 'click',
      selector: '[data-field="costPerKm"]',
      validate: [
        ['hasClass', '[data-field="costPerKm"]', 'selected']
      ]
    },

    {
      action: 'click',
      selector: '[data-operation="set"]'
    },

    {
      action: 'fill',
      fields: {
        '.operation-value-input': '2.50'
      },
      validate: [
        ['inputHasValue', '.operation-value-input', '2.50']
      ]
    },

    // Step 15: Preview conditional changes
    {
      action: 'click',
      selector: '[data-testid="preview-changes-button"]',
      waitFor: 'networkIdle',
      validate: [
        ['elementVisible', '.change-preview'],
        ['textContains', '.condition-summary', 'profile equals truck']
      ]
    },

    {
      action: 'screenshot',
      name: 'conditional-bulk-edit-preview'
    },

    // Step 16: Test error handling - validation error
    {
      action: 'click',
      selector: '[data-testid="cancel-preview"]'
    },

    {
      action: 'fill',
      fields: {
        '.operation-value-input': '-1' // Invalid negative value
      }
    },

    {
      action: 'click',
      selector: '[data-testid="preview-changes-button"]',
      validate: [
        ['elementVisible', '.validation-error'],
        ['textContains', '.error-message', 'must be non-negative']
      ]
    },

    // Step 17: Test COPY operation
    {
      action: 'click',
      selector: '[data-testid="clear-operation"]' // Clear invalid operation
    },

    {
      action: 'click',
      selector: '[data-field="description"]'
    },

    {
      action: 'click',
      selector: '[data-operation="copy"]',
      validate: [
        ['elementVisible', '.source-field-selector']
      ]
    },

    {
      action: 'click',
      selector: '[data-source-field="profile"]',
      validate: [
        ['elementNotExists', '.operation-value-input'] // Copy doesn't need manual value
      ]
    },

    {
      action: 'click',
      selector: '[data-testid="apply-changes-button"]',
      waitFor: 'networkIdle',
      validate: [
        ['elementVisible', '.operation-success']
      ]
    },

    // Step 18: Test performance with large selection
    {
      action: 'click',
      selector: '[data-testid="close-bulk-edit-modal"]'
    },

    {
      action: 'custom_script',
      script: `
        // Simulate large dataset by selecting many rows programmatically
        const checkboxes = document.querySelectorAll('.data-table .row-checkbox');
        checkboxes.forEach(cb => cb.checked = true);
        // Trigger selection change event
        checkboxes[0]?.dispatchEvent(new Event('change', { bubbles: true }));
      `,
      validate: [
        ['elementVisible', '.bulk-edit-toolbar']
      ]
    },

    {
      action: 'click',
      selector: '[data-testid="bulk-edit-button"]',
      validate: [
        ['elementVisible', '.bulk-edit-modal']
      ]
    },

    {
      action: 'click',
      selector: '[data-field="updatedAt"]'
    },

    {
      action: 'click',
      selector: '[data-operation="set"]'
    },

    {
      action: 'fill',
      fields: {
        '.operation-value-input': new Date().toISOString()
      }
    },

    {
      action: 'click',
      selector: '[data-testid="preview-changes-button"]',
      waitFor: 'networkIdle',
      validate: [
        ['elementVisible', '.change-preview'],
        ['elementExists', '.performance-notice'] // Should show performance notice for large operations
      ]
    },

    // Step 19: Final verification and cleanup
    {
      action: 'click',
      selector: '[data-testid="close-bulk-edit-modal"]',
      validate: [
        ['elementNotExists', '.bulk-edit-modal']
      ]
    },

    {
      action: 'click',
      selector: '.table-header .select-all-checkbox', // Deselect all
      validate: [
        ['textContains', '.selection-count', '0 selected'],
        ['elementNotExists', '.bulk-edit-toolbar']
      ]
    },

    {
      action: 'verify_state',
      validate: [
        ['healthCheck', 'hasErrors', false],
        ['healthCheck', 'getDataLoadState().vehicles', 'success']
      ]
    },

    {
      action: 'screenshot',
      name: 'bulk-editing-complete'
    }
  ]
};