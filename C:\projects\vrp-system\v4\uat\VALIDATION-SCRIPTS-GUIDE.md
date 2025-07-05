# Validation Scripts and Injection Guide

## Overview

Validation scripts provide assertion capabilities directly in the browser during UAT testing. They enable Claude Code to verify specific conditions and provide detailed error messages when tests fail.

## Core Concept

Instead of Claude Code guessing whether an action succeeded, validation scripts let it verify:
- Elements exist and are visible
- Text content matches expectations
- Forms have correct values
- Network requests completed
- No JavaScript errors occurred

## Implementation

### The Complete Validation Script

This script should be injected at the start of each UAT test session:

```javascript
// UAT Validation and Assertion Framework
(function() {
  'use strict';
  
  // Prevent multiple injections
  if (window.__assert) return;
  
  window.__assert = {
    // Core assertion methods
    elementExists: function(selector, timeout = 5000) {
      return new Promise((resolve, reject) => {
        const startTime = Date.now();
        
        const check = () => {
          const element = document.querySelector(selector);
          if (element) {
            resolve(element);
          } else if (Date.now() - startTime > timeout) {
            reject(new Error(`Element not found: ${selector}`));
          } else {
            setTimeout(check, 100);
          }
        };
        
        check();
      });
    },
    
    elementNotExists: function(selector, timeout = 5000) {
      return new Promise((resolve, reject) => {
        const startTime = Date.now();
        
        const check = () => {
          const element = document.querySelector(selector);
          if (!element) {
            resolve(true);
          } else if (Date.now() - startTime > timeout) {
            reject(new Error(`Element still exists: ${selector}`));
          } else {
            setTimeout(check, 100);
          }
        };
        
        check();
      });
    },
    
    elementVisible: function(selector, timeout = 5000) {
      return this.elementExists(selector, timeout).then(element => {
        const styles = window.getComputedStyle(element);
        const isVisible = styles.display !== 'none' && 
                         styles.visibility !== 'hidden' && 
                         styles.opacity !== '0' &&
                         element.offsetWidth > 0 &&
                         element.offsetHeight > 0;
        
        if (!isVisible) {
          throw new Error(`Element exists but not visible: ${selector}`);
        }
        
        return element;
      });
    },
    
    textContains: function(selector, expectedText, options = {}) {
      const { exact = false, caseSensitive = false, timeout = 5000 } = options;
      
      return this.elementExists(selector, timeout).then(element => {
        let actualText = element.textContent || '';
        let searchText = expectedText;
        
        if (!caseSensitive) {
          actualText = actualText.toLowerCase();
          searchText = searchText.toLowerCase();
        }
        
        const matches = exact 
          ? actualText.trim() === searchText.trim()
          : actualText.includes(searchText);
        
        if (!matches) {
          throw new Error(
            `Text mismatch in ${selector}\n` +
            `Expected: "${expectedText}"\n` +
            `Actual: "${element.textContent}"`
          );
        }
        
        return element;
      });
    },
    
    inputHasValue: function(selector, expectedValue, options = {}) {
      const { exact = true, timeout = 5000 } = options;
      
      return this.elementExists(selector, timeout).then(element => {
        if (!(element instanceof HTMLInputElement || 
              element instanceof HTMLTextAreaElement || 
              element instanceof HTMLSelectElement)) {
          throw new Error(`Element ${selector} is not an input element`);
        }
        
        const actualValue = element.value;
        const matches = exact 
          ? actualValue === expectedValue
          : actualValue.includes(expectedValue);
        
        if (!matches) {
          throw new Error(
            `Input value mismatch in ${selector}\n` +
            `Expected: "${expectedValue}"\n` +
            `Actual: "${actualValue}"`
          );
        }
        
        return element;
      });
    },
    
    urlMatches: function(expectedUrl, options = {}) {
      const { exact = false, timeout = 5000 } = options;
      
      return new Promise((resolve, reject) => {
        const startTime = Date.now();
        
        const check = () => {
          const currentUrl = window.location.href;
          const currentPath = window.location.pathname;
          
          const matches = exact 
            ? currentUrl === expectedUrl || currentPath === expectedUrl
            : currentUrl.includes(expectedUrl) || currentPath.includes(expectedUrl);
          
          if (matches) {
            resolve(currentUrl);
          } else if (Date.now() - startTime > timeout) {
            reject(new Error(
              `URL mismatch\n` +
              `Expected: "${expectedUrl}"\n` +
              `Actual: "${currentUrl}"`
            ));
          } else {
            setTimeout(check, 100);
          }
        };
        
        check();
      });
    },
    
    waitForNetworkIdle: function(timeout = 10000, idleTime = 500) {
      return new Promise((resolve) => {
        let pendingRequests = 0;
        let idleTimer;
        const startTime = Date.now();
        
        // Track fetch requests
        const originalFetch = window.fetch;
        window.fetch = function(...args) {
          pendingRequests++;
          
          return originalFetch.apply(this, args).finally(() => {
            pendingRequests--;
            checkIdle();
          });
        };
        
        // Track XHR requests
        const originalOpen = XMLHttpRequest.prototype.open;
        const originalSend = XMLHttpRequest.prototype.send;
        
        XMLHttpRequest.prototype.open = function(...args) {
          this._uatTracked = true;
          return originalOpen.apply(this, args);
        };
        
        XMLHttpRequest.prototype.send = function(...args) {
          if (this._uatTracked) {
            pendingRequests++;
            
            this.addEventListener('loadend', () => {
              pendingRequests--;
              checkIdle();
            });
          }
          
          return originalSend.apply(this, args);
        };
        
        function checkIdle() {
          clearTimeout(idleTimer);
          
          if (pendingRequests === 0) {
            idleTimer = setTimeout(() => {
              // Restore original functions
              window.fetch = originalFetch;
              XMLHttpRequest.prototype.open = originalOpen;
              XMLHttpRequest.prototype.send = originalSend;
              
              resolve();
            }, idleTime);
          } else if (Date.now() - startTime > timeout) {
            // Timeout reached, resolve anyway
            window.fetch = originalFetch;
            XMLHttpRequest.prototype.open = originalOpen;
            XMLHttpRequest.prototype.send = originalSend;
            
            resolve();
          }
        }
        
        // Initial check
        checkIdle();
      });
    },
    
    waitForElement: function(selector, options = {}) {
      const { visible = false, timeout = 5000 } = options;
      return visible 
        ? this.elementVisible(selector, timeout)
        : this.elementExists(selector, timeout);
    },
    
    waitForText: function(selector, text, options = {}) {
      return this.textContains(selector, text, options);
    },
    
    // Form validation helpers
    formIsValid: function(formSelector) {
      return this.elementExists(formSelector).then(form => {
        if (!(form instanceof HTMLFormElement)) {
          throw new Error(`Element ${formSelector} is not a form`);
        }
        
        const isValid = form.checkValidity();
        if (!isValid) {
          const invalidFields = Array.from(form.elements)
            .filter(el => el instanceof HTMLInputElement && !el.checkValidity())
            .map(el => ({
              name: el.name,
              id: el.id,
              validationMessage: el.validationMessage
            }));
          
          throw new Error(
            `Form validation failed:\n` +
            invalidFields.map(f => `- ${f.name || f.id}: ${f.validationMessage}`).join('\n')
          );
        }
        
        return true;
      });
    },
    
    // Advanced assertions
    hasClass: function(selector, className) {
      return this.elementExists(selector).then(element => {
        if (!element.classList.contains(className)) {
          throw new Error(
            `Element ${selector} does not have class "${className}"\n` +
            `Classes: ${element.className}`
          );
        }
        return element;
      });
    },
    
    hasAttribute: function(selector, attributeName, attributeValue = null) {
      return this.elementExists(selector).then(element => {
        const hasAttr = element.hasAttribute(attributeName);
        
        if (!hasAttr) {
          throw new Error(`Element ${selector} does not have attribute "${attributeName}"`);
        }
        
        if (attributeValue !== null) {
          const actualValue = element.getAttribute(attributeName);
          if (actualValue !== attributeValue) {
            throw new Error(
              `Attribute value mismatch in ${selector}\n` +
              `Attribute: ${attributeName}\n` +
              `Expected: "${attributeValue}"\n` +
              `Actual: "${actualValue}"`
            );
          }
        }
        
        return element;
      });
    },
    
    // Table assertions
    tableRowCount: function(selector, expectedCount) {
      return this.elementExists(selector).then(table => {
        const rows = table.querySelectorAll('tbody tr, tr').length;
        
        if (rows !== expectedCount) {
          throw new Error(
            `Table row count mismatch in ${selector}\n` +
            `Expected: ${expectedCount}\n` +
            `Actual: ${rows}`
          );
        }
        
        return rows;
      });
    },
    
    tableContainsText: function(selector, searchText) {
      return this.elementExists(selector).then(table => {
        const cells = table.querySelectorAll('td, th');
        const found = Array.from(cells).some(cell => 
          cell.textContent && cell.textContent.includes(searchText)
        );
        
        if (!found) {
          throw new Error(`Text "${searchText}" not found in table ${selector}`);
        }
        
        return true;
      });
    },
    
    // Utility methods
    getAllErrors: function() {
      const errors = [];
      
      // Check for error elements
      const errorElements = document.querySelectorAll(
        '.error, .error-message, .alert-error, [role="alert"], .form-error'
      );
      
      errorElements.forEach(el => {
        const text = el.textContent?.trim();
        if (text) errors.push(text);
      });
      
      // Check console for errors (if health check available)
      if (window.__UAT_HEALTH__) {
        const actionLog = window.__UAT_HEALTH__.getActionLog();
        const jsErrors = actionLog
          .filter(a => a.action === 'javascript_error')
          .map(a => a.details.message);
        
        errors.push(...jsErrors);
      }
      
      return errors;
    },
    
    screenshot: async function(name = 'assertion-fail') {
      // Trigger screenshot via health check if available
      if (window.__UAT_HEALTH__) {
        window.__UAT_HEALTH__.logAction('screenshot_request', { name });
      }
      
      return `Screenshot requested: ${name}`;
    }
  };
  
  // Helper function for batch assertions
  window.__assert.batch = async function(assertions) {
    const results = [];
    
    for (const assertion of assertions) {
      try {
        const result = await assertion();
        results.push({ success: true, result });
      } catch (error) {
        results.push({ success: false, error: error.message });
      }
    }
    
    const failures = results.filter(r => !r.success);
    if (failures.length > 0) {
      throw new Error(
        `Batch assertion failed: ${failures.length} of ${assertions.length} failed\n` +
        failures.map((f, i) => `${i + 1}. ${f.error}`).join('\n')
      );
    }
    
    return results;
  };
  
  console.log('UAT Validation Framework injected successfully');
})();
```

## Usage in Claude Code

### 1. Inject the Validation Script

```javascript
// At the start of your UAT test
await browser.evaluate(validationScriptContent); // The script above

// Verify injection
const injected = await browser.evaluate(`typeof window.__assert !== 'undefined'`);
if (!injected) throw new Error('Failed to inject validation script');
```

### 2. Basic Element Assertions

```javascript
// Check element exists
await browser.evaluate(`window.__assert.elementExists('#login-button')`);

// Check element is visible
await browser.evaluate(`window.__assert.elementVisible('.dashboard-content')`);

// Check element does not exist
await browser.evaluate(`window.__assert.elementNotExists('.error-message')`);
```

### 3. Text Validation

```javascript
// Check exact text
await browser.evaluate(`
  window.__assert.textContains('h1', 'Welcome to VRP System', { exact: true })
`);

// Check partial text (case-insensitive)
await browser.evaluate(`
  window.__assert.textContains('.status', 'success', { caseSensitive: false })
`);
```

### 4. Form Validation

```javascript
// Check input value
await browser.evaluate(`
  window.__assert.inputHasValue('#email', 'test@example.com')
`);

// Validate entire form
await browser.evaluate(`
  window.__assert.formIsValid('#login-form')
`);
```

### 5. Navigation Validation

```javascript
// Check URL changed
await browser.evaluate(`
  window.__assert.urlMatches('/dashboard')
`);

// Wait for network to settle
await browser.evaluate(`
  window.__assert.waitForNetworkIdle()
`);
```

### 6. Complex Workflows

```javascript
// Login workflow with validations
async function validateLogin(email, password) {
  // 1. Verify on login page
  await browser.evaluate(`window.__assert.urlMatches('/login')`);
  
  // 2. Fill form
  await browser.type('#email', email);
  await browser.type('#password', password);
  
  // 3. Verify form filled correctly
  await browser.evaluate(`
    window.__assert.batch([
      () => window.__assert.inputHasValue('#email', '${email}'),
      () => window.__assert.inputHasValue('#password', '${password.replace(/./g, '*')}')
    ])
  `);
  
  // 4. Submit and wait
  await browser.click('#login-button');
  await browser.evaluate(`window.__assert.waitForNetworkIdle()`);
  
  // 5. Verify success
  await browser.evaluate(`
    window.__assert.batch([
      () => window.__assert.urlMatches('/dashboard'),
      () => window.__assert.elementNotExists('.error-message'),
      () => window.__assert.elementVisible('.user-menu')
    ])
  `);
}
```

### 7. Error Handling

```javascript
// Catch and report validation errors
try {
  await browser.evaluate(`
    window.__assert.elementVisible('#non-existent-element')
  `);
} catch (error) {
  console.log('Validation failed:', error.message);
  // Take screenshot on failure
  await browser.screenshot();
  // Get all errors on page
  const errors = await browser.evaluate(`window.__assert.getAllErrors()`);
  console.log('Page errors:', errors);
}
```

## Advanced Patterns

### Custom Wait Conditions

```javascript
// Wait for specific condition
async function waitForCondition(condition, timeout = 10000) {
  const result = await browser.evaluate(`
    new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const check = async () => {
        try {
          const result = await (${condition})();
          if (result) {
            resolve(result);
          } else if (Date.now() - startTime > ${timeout}) {
            reject(new Error('Timeout waiting for condition'));
          } else {
            setTimeout(check, 100);
          }
        } catch (error) {
          if (Date.now() - startTime > ${timeout}) {
            reject(error);
          } else {
            setTimeout(check, 100);
          }
        }
      };
      
      check();
    })
  `);
  
  return result;
}

// Usage
await waitForCondition(() => 
  document.querySelectorAll('.data-row').length >= 10
);
```

### State Change Detection

```javascript
// Capture initial state
const initialState = await browser.evaluate(`({
  rowCount: document.querySelectorAll('tr').length,
  formData: window.__assert.getFormData ? window.__assert.getFormData() : {}
})`);

// Perform action
await browser.click('#add-button');

// Wait for state change
await browser.evaluate(`
  window.__assert.waitForElement('.new-row', { visible: true })
`);

// Verify state changed
const newState = await browser.evaluate(`({
  rowCount: document.querySelectorAll('tr').length,
  formData: window.__assert.getFormData ? window.__assert.getFormData() : {}
})`);

if (newState.rowCount <= initialState.rowCount) {
  throw new Error('Row was not added');
}
```

## Integration with Health Checks

```javascript
// Combined validation
const validation = await browser.evaluate(`
  (async () => {
    const results = {
      assertions: {},
      health: {},
      errors: []
    };
    
    // Run assertions
    try {
      await window.__assert.elementVisible('.dashboard');
      results.assertions.dashboardVisible = true;
    } catch (e) {
      results.errors.push(e.message);
    }
    
    // Check health
    if (window.__UAT_HEALTH__) {
      results.health = {
        isLoggedIn: window.__UAT_HEALTH__.isLoggedIn(),
        hasErrors: window.__UAT_HEALTH__.hasErrors(),
        loadState: window.__UAT_HEALTH__.getDataLoadState()
      };
    }
    
    // Get page errors
    results.pageErrors = window.__assert.getAllErrors();
    
    return results;
  })()
`);
```

## Best Practices

1. **Always inject at start**: Inject validation script before any test actions
2. **Use appropriate timeouts**: Default 5s, increase for slow operations
3. **Prefer specific selectors**: Use IDs or data-testid attributes
4. **Batch related assertions**: Group assertions that should all pass
5. **Screenshot on failure**: Capture visual state when assertions fail
6. **Check both positive and negative**: Verify both presence and absence
7. **Use semantic assertions**: `elementVisible` vs just `elementExists`

## Troubleshooting

### Script Not Injected

```javascript
// Debug injection
const debug = await browser.evaluate(`({
  hasAssert: typeof window.__assert !== 'undefined',
  assertKeys: window.__assert ? Object.keys(window.__assert) : [],
  hasHealth: typeof window.__UAT_HEALTH__ !== 'undefined'
})`);
```

### Timeout Issues

```javascript
// Increase timeout for slow operations
await browser.evaluate(`
  window.__assert.elementVisible('#slow-loading', 30000) // 30 second timeout
`);
```

### Flaky Tests

```javascript
// Add stability checks
await browser.evaluate(`
  // Wait for animations to complete
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Then check element
  await window.__assert.elementVisible('#animated-element');
`);
```

## Next Steps

1. Copy the validation script to your project
2. Create a helper function to inject it in your tests
3. Replace simple browser clicks with validated workflows
4. Add custom assertions for your specific UI patterns