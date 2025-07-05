/**
 * UAT Validation Framework
 * 
 * This script is injected into the browser to provide assertion capabilities
 * for UAT testing. It integrates with the health check system to provide
 * comprehensive validation of application state.
 */

const UAT_VALIDATION_FRAMEWORK = `
(function() {
  'use strict';
  
  // Prevent multiple injections
  if (window.__assert) return;
  
  // Core assertion framework
  window.__assert = {
    
    // ELEMENT ASSERTIONS
    
    elementExists: function(selector, timeout = 5000) {
      return new Promise((resolve, reject) => {
        const startTime = Date.now();
        
        const check = () => {
          const element = document.querySelector(selector);
          if (element) {
            resolve(element);
          } else if (Date.now() - startTime > timeout) {
            reject(new Error(\`Element not found after \${timeout}ms: \${selector}\`));
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
            reject(new Error(\`Element still exists after \${timeout}ms: \${selector}\`));
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
        const rect = element.getBoundingClientRect();
        
        const isVisible = styles.display !== 'none' && 
                         styles.visibility !== 'hidden' && 
                         styles.opacity !== '0' &&
                         rect.width > 0 &&
                         rect.height > 0 &&
                         rect.top < window.innerHeight &&
                         rect.bottom > 0 &&
                         rect.left < window.innerWidth &&
                         rect.right > 0;
        
        if (!isVisible) {
          throw new Error(\`Element exists but not visible: \${selector}\`);
        }
        
        return element;
      });
    },
    
    // TEXT ASSERTIONS
    
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
          throw new Error(\`Text assertion failed. Expected "\${expectedText}" in element \${selector}. Actual text: "\${element.textContent}"\`);
        }
        
        return element;
      });
    },
    
    textEquals: function(selector, expectedText, caseSensitive = false) {
      return this.textContains(selector, expectedText, { exact: true, caseSensitive });
    },
    
    // FORM ASSERTIONS
    
    inputHasValue: function(selector, expectedValue, timeout = 5000) {
      return this.elementExists(selector, timeout).then(element => {
        if (!['INPUT', 'TEXTAREA', 'SELECT'].includes(element.tagName)) {
          throw new Error(\`Element is not a form input: \${selector}\`);
        }
        
        const actualValue = element.value;
        if (actualValue !== expectedValue) {
          throw new Error(\`Input value mismatch. Expected "\${expectedValue}" but got "\${actualValue}" for \${selector}\`);
        }
        
        return element;
      });
    },
    
    formIsValid: function(formSelector, timeout = 5000) {
      return this.elementExists(formSelector, timeout).then(form => {
        if (form.tagName !== 'FORM') {
          throw new Error(\`Element is not a form: \${formSelector}\`);
        }
        
        // Check HTML5 validation
        if (!form.checkValidity()) {
          const invalidElements = form.querySelectorAll(':invalid');
          const errors = Array.from(invalidElements).map(el => {
            return \`\${el.name || el.id || el.tagName}: \${el.validationMessage}\`;
          });
          throw new Error(\`Form validation failed: \${errors.join(', ')}\`);
        }
        
        // Check for custom error indicators
        const errorElements = form.querySelectorAll('.error, .invalid, [aria-invalid="true"]');
        if (errorElements.length > 0) {
          throw new Error(\`Form has \${errorElements.length} elements with error indicators\`);
        }
        
        return true;
      });
    },
    
    // ATTRIBUTE ASSERTIONS
    
    hasClass: function(selector, className, timeout = 5000) {
      return this.elementExists(selector, timeout).then(element => {
        if (!element.classList.contains(className)) {
          throw new Error(\`Element does not have class "\${className}": \${selector}\`);
        }
        return element;
      });
    },
    
    hasAttribute: function(selector, attributeName, expectedValue = null, timeout = 5000) {
      return this.elementExists(selector, timeout).then(element => {
        const hasAttr = element.hasAttribute(attributeName);
        
        if (!hasAttr) {
          throw new Error(\`Element does not have attribute "\${attributeName}": \${selector}\`);
        }
        
        if (expectedValue !== null) {
          const actualValue = element.getAttribute(attributeName);
          if (actualValue !== expectedValue) {
            throw new Error(\`Attribute value mismatch. Expected "\${expectedValue}" but got "\${actualValue}" for attribute "\${attributeName}" on \${selector}\`);
          }
        }
        
        return element;
      });
    },
    
    // NAVIGATION ASSERTIONS
    
    urlMatches: function(pattern, exact = false) {
      const currentPath = window.location.pathname;
      const currentUrl = window.location.href;
      
      let matches;
      if (exact) {
        matches = currentPath === pattern || currentUrl === pattern;
      } else {
        matches = currentPath.includes(pattern) || currentUrl.includes(pattern);
      }
      
      if (!matches) {
        throw new Error(\`URL assertion failed. Expected "\${pattern}" to match current URL: \${currentUrl}\`);
      }
      
      return true;
    },
    
    // HEALTH CHECK ASSERTIONS
    
    healthCheck: function(property, expectedValue = true) {
      if (!window.__UAT_HEALTH__) {
        throw new Error('Health check system not available. Ensure application is in development mode.');
      }
      
      let actualValue;
      
      if (typeof property === 'string') {
        if (typeof window.__UAT_HEALTH__[property] === 'function') {
          actualValue = window.__UAT_HEALTH__[property]();
        } else {
          actualValue = window.__UAT_HEALTH__[property];
        }
      } else if (typeof property === 'function') {
        actualValue = property();
      } else {
        throw new Error('Health check property must be a string or function');
      }
      
      if (actualValue !== expectedValue) {
        throw new Error(\`Health check failed: \${property} expected \${expectedValue} but got \${actualValue}\`);
      }
      
      return actualValue;
    },
    
    // TABLE ASSERTIONS
    
    tableRowCount: function(tableSelector, expectedCount, timeout = 5000) {
      return this.elementExists(tableSelector, timeout).then(table => {
        const rows = table.querySelectorAll('tbody tr, tr');
        const actualCount = rows.length;
        
        if (actualCount !== expectedCount) {
          throw new Error(\`Table row count mismatch. Expected \${expectedCount} but got \${actualCount} in \${tableSelector}\`);
        }
        
        return rows;
      });
    },
    
    tableContainsText: function(tableSelector, searchText, timeout = 5000) {
      return this.elementExists(tableSelector, timeout).then(table => {
        const tableText = table.textContent || '';
        
        if (!tableText.includes(searchText)) {
          throw new Error(\`Table does not contain text "\${searchText}" in \${tableSelector}\`);
        }
        
        return table;
      });
    },
    
    // UTILITY METHODS
    
    wait: function(milliseconds) {
      return new Promise(resolve => setTimeout(resolve, milliseconds));
    },
    
    waitForNetworkIdle: function(timeout = 10000) {
      return new Promise((resolve, reject) => {
        let pendingRequests = 0;
        let timeoutId;
        
        const checkIdle = () => {
          if (pendingRequests === 0) {
            clearTimeout(timeoutId);
            resolve(true);
          }
        };
        
        // Monitor fetch requests
        const originalFetch = window.fetch;
        window.fetch = function(...args) {
          pendingRequests++;
          return originalFetch.apply(this, args).finally(() => {
            pendingRequests--;
            setTimeout(checkIdle, 100);
          });
        };
        
        // Monitor XMLHttpRequests
        const originalXHROpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function(...args) {
          pendingRequests++;
          this.addEventListener('loadend', () => {
            pendingRequests--;
            setTimeout(checkIdle, 100);
          });
          return originalXHROpen.apply(this, args);
        };
        
        // Set timeout
        timeoutId = setTimeout(() => {
          reject(new Error(\`Network idle timeout after \${timeout}ms. \${pendingRequests} requests still pending.\`));
        }, timeout);
        
        // Initial check
        setTimeout(checkIdle, 100);
      });
    },
    
    // BATCH OPERATIONS
    
    batch: function(assertions) {
      const promises = assertions.map((assertion, index) => {
        return Promise.resolve(assertion()).catch(error => {
          throw new Error(\`Batch assertion \${index + 1} failed: \${error.message}\`);
        });
      });
      
      return Promise.all(promises);
    },
    
    // ERROR COLLECTION
    
    getAllErrors: function() {
      const errors = [];
      
      // DOM errors
      const errorElements = document.querySelectorAll('.error, .error-message, [role="alert"], .alert-error');
      errorElements.forEach(el => {
        if (el.textContent.trim()) {
          errors.push({
            type: 'dom',
            text: el.textContent.trim(),
            element: el.tagName.toLowerCase() + (el.className ? '.' + el.className.split(' ').join('.') : '')
          });
        }
      });
      
      // Console errors (if captured by health check)
      if (window.__UAT_HEALTH__ && window.__UAT_HEALTH__.getActionLog) {
        const actionLog = window.__UAT_HEALTH__.getActionLog();
        const errorActions = actionLog.filter(action => 
          action.action.includes('error') || action.action.includes('failure')
        );
        
        errorActions.forEach(action => {
          errors.push({
            type: 'javascript',
            text: action.details?.message || action.action,
            timestamp: action.timestamp
          });
        });
      }
      
      return errors;
    },
    
    // PERFORMANCE HELPERS
    
    getPerformanceMetrics: function() {
      const navigation = performance.getEntriesByType('navigation')[0];
      const paint = performance.getEntriesByType('paint');
      
      return {
        domContentLoaded: navigation ? navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart : null,
        loadComplete: navigation ? navigation.loadEventEnd - navigation.loadEventStart : null,
        firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || null,
        firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || null
      };
    }
  };
  
  // Helper to log assertions (for debugging)
  if (window.__UAT_HEALTH__ && window.__UAT_HEALTH__.logAction) {
    const originalAssert = { ...window.__assert };
    
    Object.keys(window.__assert).forEach(method => {
      if (typeof window.__assert[method] === 'function') {
        window.__assert[method] = function(...args) {
          window.__UAT_HEALTH__.logAction(\`assertion_\${method}\`, { args });
          return originalAssert[method].apply(this, args);
        };
      }
    });
  }
  
  console.log('🧪 UAT Validation Framework injected successfully');
})();
`;

module.exports = {
  getValidationFramework: () => UAT_VALIDATION_FRAMEWORK
};