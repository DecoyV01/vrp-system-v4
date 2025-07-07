// bulk-import-export.cjs - Comprehensive bulk import/export testing for table editor

module.exports = {
  name: 'bulk-import-export',
  description: 'Test comprehensive CSV import/export functionality for vehicles, jobs, and locations',
  timeout: 90000, // Extended timeout for file operations
  preconditions: [
    'user must be logged in',
    'project with dataset must be selected',
    'table editor page must be accessible'
  ],
  objectives: [
    {
      id: "csv_import_workflow",
      title: "CSV Import End-to-End Workflow",
      description: "Verify complete CSV import process including file selection, parsing, validation, mapping, and data import",
      category: "CRUD Operations",
      priority: "Critical",
      acceptance_criteria: [
        "User can access CSV import functionality from table editor",
        "System correctly parses CSV files with proper error handling",
        "Column mapping interface allows flexible field assignment",
        "Validation catches data type and business rule violations",
        "Duplicate detection and resolution works accurately",
        "Import process completes successfully with appropriate feedback",
        "Imported data appears correctly in the table with real-time updates"
      ],
      steps: ["navigate", "click", "upload_file", "verify_parsing", "configure_mapping", "handle_duplicates", "execute_import", "verify_results"],
      dependencies: []
    },
    {
      id: "csv_export_workflow", 
      title: "CSV Export Functionality",
      description: "Verify CSV export supports different scopes, formats, and column selections",
      category: "CRUD Operations",
      priority: "High",
      acceptance_criteria: [
        "User can access export functionality from table editor",
        "Export scope options work (all, filtered, selected)",
        "Column selection interface allows customization",
        "Export format options generate correct file types",
        "Downloaded files contain expected data and structure",
        "Export metadata is accurate and complete"
      ],
      steps: ["access_export", "configure_export", "download_file", "verify_content"],
      dependencies: ["csv_import_workflow"]
    },
    {
      id: "data_validation_framework",
      title: "Import Data Validation",
      description: "Verify comprehensive validation during import including business rules and data integrity",
      category: "Data Integrity", 
      priority: "Critical",
      acceptance_criteria: [
        "Required field validation prevents incomplete records",
        "Data type validation catches format mismatches",
        "Business rule validation enforces VRP constraints",
        "Cross-field validation works for related data",
        "Validation error messages are clear and actionable",
        "Users can correct validation errors before import",
        "Partial import option allows proceeding with valid records"
      ],
      steps: ["upload_invalid_file", "review_validation", "correct_errors", "retry_import"],
      dependencies: []
    },
    {
      id: "duplicate_management",
      title: "Duplicate Detection and Resolution",
      description: "Verify system accurately detects duplicates and provides resolution options",
      category: "Data Integrity",
      priority: "High", 
      acceptance_criteria: [
        "System detects duplicates using natural keys and fuzzy matching",
        "Duplicate confidence scoring provides useful guidance",
        "Resolution options (replace, create new, skip) work correctly",
        "Bulk duplicate resolution allows efficient processing",
        "Conflict resolution preserves data integrity",
        "Users receive clear feedback on duplicate handling results"
      ],
      steps: ["upload_duplicate_file", "review_duplicates", "configure_resolution", "execute_import"],
      dependencies: ["csv_import_workflow"]
    },
    {
      id: "performance_large_datasets",
      title: "Large Dataset Import Performance",
      description: "Verify system handles large CSV files efficiently with appropriate progress feedback",
      category: "UI/UX",
      priority: "Medium",
      acceptance_criteria: [
        "System processes large files (1000+ records) without timeouts",
        "Progress indicators provide accurate feedback during processing",
        "Chunked processing prevents browser blocking",
        "Memory usage remains reasonable during import",
        "Error handling works correctly for large datasets",
        "Real-time updates handle bulk data changes efficiently"
      ],
      steps: ["upload_large_file", "monitor_progress", "verify_completion"],
      dependencies: ["csv_import_workflow"]
    },
    {
      id: "error_recovery_handling",
      title: "Import Error Recovery",
      description: "Verify robust error handling and recovery mechanisms during import process",
      category: "Error Handling",
      priority: "High",
      acceptance_criteria: [
        "Network failures during import are handled gracefully",
        "Malformed files generate appropriate error messages",
        "Partial import failures allow retry of failed records",
        "System recovers properly from validation errors",
        "Users can abort import process safely",
        "Error states provide clear next steps for resolution"
      ],
      steps: ["test_network_failure", "test_malformed_file", "test_abort_import"],
      dependencies: []
    }
  ],
  steps: [
    // Step 1: Navigate to table editor page
    {
      action: 'navigate',
      url: '/projects/test-project/datasets/test-dataset/vehicles',
      validate: [
        ['urlMatches', '/vehicles'],
        ['elementVisible', '.table-editor-container'],
        ['healthCheck', 'getDataLoadState().vehicles', 'success']
      ]
    },

    // Step 2: Access import functionality
    {
      action: 'click',
      selector: '[data-testid="bulk-operations-button"]',
      validate: [
        ['elementVisible', '.bulk-operations-menu']
      ]
    },

    {
      action: 'click', 
      selector: '[data-testid="import-csv-button"]',
      validate: [
        ['elementVisible', '.csv-import-modal'],
        ['elementVisible', '[data-testid="file-upload-zone"]']
      ]
    },

    // Step 3: Upload CSV file
    {
      action: 'upload_file',
      selector: '[data-testid="file-upload-input"]',
      file: 'test-vehicles.csv',
      validate: [
        ['elementVisible', '.file-upload-success'],
        ['textContains', '.file-info', 'test-vehicles.csv'],
        ['elementVisible', '.parsing-progress']
      ]
    },

    // Step 4: Verify file parsing
    {
      action: 'verify_state',
      description: 'Wait for CSV parsing to complete',
      validate: [
        ['elementVisible', '.parsing-results'],
        ['elementNotExists', '.parsing-progress'],
        ['textContains', '.record-count', '50'], // Expect 50 test records
        ['healthCheck', 'hasErrors', false]
      ]
    },

    // Step 5: Review and configure column mapping
    {
      action: 'verify_state',
      validate: [
        ['elementVisible', '.column-mapping-section'],
        ['elementExists', '.mapping-confidence-indicator'],
        ['tableRowCount', '.column-mapping-table tr', 8] // Vehicle table has ~8 main columns
      ]
    },

    {
      action: 'screenshot',
      name: 'column-mapping-interface'
    },

    // Step 6: Configure import options
    {
      action: 'click',
      selector: '[data-testid="duplicate-handling-dropdown"]',
      validate: ['elementVisible', '.duplicate-options']
    },

    {
      action: 'click',
      selector: '[data-value="replace"]',
      validate: [
        ['hasAttribute', '[data-testid="duplicate-handling-dropdown"]', 'data-value', 'replace']
      ]
    },

    // Step 7: Review validation results
    {
      action: 'click',
      selector: '[data-testid="validate-data-button"]',
      waitFor: 'networkIdle',
      validate: [
        ['elementVisible', '.validation-results'],
        ['elementExists', '.validation-summary']
      ]
    },

    {
      action: 'verify_state',
      validate: [
        ['elementVisible', '.validation-tabs'],
        ['textContains', '.validation-summary', 'validation complete']
      ]
    },

    {
      action: 'screenshot',
      name: 'validation-results'
    },

    // Step 8: Handle any duplicates
    {
      action: 'click',
      selector: '[data-tab="duplicates"]',
      validate: [
        ['elementVisible', '.duplicate-list']
      ]
    },

    {
      action: 'verify_state',
      validate: [
        ['elementExists', '.duplicate-resolution-options']
      ]
    },

    // Step 9: Execute import
    {
      action: 'click',
      selector: '[data-testid="execute-import-button"]',
      waitFor: 'networkIdle',
      validate: [
        ['elementVisible', '.import-progress'],
        ['healthCheck', 'isLoading', true]
      ]
    },

    // Step 10: Monitor import progress
    {
      action: 'verify_state',
      description: 'Wait for import to complete',
      validate: [
        ['elementVisible', '.import-success'],
        ['healthCheck', 'isLoading', false],
        ['textContains', '.import-summary', 'imported successfully']
      ]
    },

    {
      action: 'screenshot',
      name: 'import-completed'
    },

    // Step 11: Verify imported data in table
    {
      action: 'click',
      selector: '[data-testid="close-import-modal"]',
      validate: [
        ['elementNotExists', '.csv-import-modal']
      ]
    },

    {
      action: 'verify_state',
      validate: [
        ['tableRowCount', '.data-table tbody tr', 50], // Should show imported records
        ['healthCheck', 'getDataLoadState().vehicles', 'success']
      ]
    },

    // Step 12: Test export functionality
    {
      action: 'click',
      selector: '[data-testid="bulk-operations-button"]',
      validate: [
        ['elementVisible', '.bulk-operations-menu']
      ]
    },

    {
      action: 'click',
      selector: '[data-testid="export-csv-button"]',
      validate: [
        ['elementVisible', '.csv-export-modal'],
        ['elementVisible', '.export-options']
      ]
    },

    // Step 13: Configure export options
    {
      action: 'fill',
      fields: {
        '[data-testid="export-filename"]': 'test-vehicles-export'
      },
      validate: [
        ['inputHasValue', '[data-testid="export-filename"]', 'test-vehicles-export']
      ]
    },

    {
      action: 'click',
      selector: '[data-value="all"]', // Export scope: all records
      validate: [
        ['hasClass', '[data-value="all"]', 'selected']
      ]
    },

    // Step 14: Execute export
    {
      action: 'click',
      selector: '[data-testid="execute-export-button"]',
      waitFor: 'networkIdle',
      validate: [
        ['elementVisible', '.export-progress'],
        ['healthCheck', 'isLoading', true]
      ]
    },

    // Step 15: Verify export completion
    {
      action: 'verify_state',
      description: 'Wait for export to complete',
      validate: [
        ['elementVisible', '.export-success'],
        ['elementVisible', '[data-testid="download-link"]'],
        ['healthCheck', 'isLoading', false]
      ]
    },

    {
      action: 'screenshot',
      name: 'export-completed'
    },

    // Step 16: Test export download
    {
      action: 'click',
      selector: '[data-testid="download-link"]',
      validate: [
        ['elementVisible', '.download-initiated']
      ]
    },

    // Step 17: Test error scenarios - invalid file
    {
      action: 'click',
      selector: '[data-testid="import-csv-button"]',
      validate: [
        ['elementVisible', '.csv-import-modal']
      ]
    },

    {
      action: 'upload_file',
      selector: '[data-testid="file-upload-input"]',
      file: 'invalid-format.txt',
      validate: [
        ['elementVisible', '.file-upload-error'],
        ['textContains', '.error-message', 'Invalid file format']
      ]
    },

    // Step 18: Test validation errors
    {
      action: 'upload_file',
      selector: '[data-testid="file-upload-input"]',
      file: 'vehicles-with-errors.csv', 
      validate: [
        ['elementVisible', '.parsing-results']
      ]
    },

    {
      action: 'click',
      selector: '[data-testid="validate-data-button"]',
      waitFor: 'networkIdle',
      validate: [
        ['elementVisible', '.validation-errors'],
        ['textContains', '.error-count', 'errors found']
      ]
    },

    {
      action: 'screenshot',
      name: 'validation-errors'
    },

    // Step 19: Final verification
    {
      action: 'click',
      selector: '[data-testid="close-import-modal"]',
      validate: [
        ['elementNotExists', '.csv-import-modal']
      ]
    },

    {
      action: 'verify_state',
      validate: [
        ['healthCheck', 'hasErrors', false],
        ['elementVisible', '.table-editor-container'],
        ['healthCheck', 'getDataLoadState().vehicles', 'success']
      ]
    },

    {
      action: 'screenshot',
      name: 'bulk-import-export-complete'
    }
  ]
};