#!/usr/bin/env node

/**
 * UAT Test Session Manager
 * 
 * Manages test session persistence and tracking for both command-based
 * and scenario-based tests to provide comprehensive reporting.
 */

const fs = require('fs');
const path = require('path');

class UATTestSession {
  constructor(sessionId = null) {
    this.sessionId = sessionId || this.generateSessionId();
    this.sessionFile = path.join('/mnt/c/projects/vrp-system/v4/uat/sessions', `session-${this.sessionId}.json`);
    this.sessionData = this.loadOrCreateSession();
  }

  generateSessionId() {
    const date = new Date();
    return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}-${String(date.getHours()).padStart(2, '0')}${String(date.getMinutes()).padStart(2, '0')}${String(date.getSeconds()).padStart(2, '0')}`;
  }

  loadOrCreateSession() {
    this.ensureSessionDirectory();
    
    if (fs.existsSync(this.sessionFile)) {
      try {
        const content = fs.readFileSync(this.sessionFile, 'utf8');
        return JSON.parse(content);
      } catch (error) {
        console.warn(`⚠️ Could not load session ${this.sessionId}, creating new session`);
      }
    }
    
    // Create new session
    return {
      sessionId: this.sessionId,
      startTime: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      tests: [],
      screenshots: [],
      objectives: null, // Will be populated with objective tracking data
      metadata: {
        framework: 'VRP System UAT',
        version: '1.0.0',
        environment: 'development'
      },
      summary: {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        totalScreenshots: 0,
        duration: 0
      }
    };
  }

  ensureSessionDirectory() {
    const sessionDir = path.dirname(this.sessionFile);
    if (!fs.existsSync(sessionDir)) {
      fs.mkdirSync(sessionDir, { recursive: true });
    }
  }

  /**
   * Record a test result (command-based or scenario-based)
   */
  recordTest(testResult) {
    const test = {
      id: `test_${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: testResult.type || 'command', // 'command' or 'scenario'
      name: testResult.name || `${testResult.entity || 'unknown'}_${testResult.action || 'test'}`,
      status: testResult.success ? 'passed' : 'failed',
      duration: testResult.duration || 0,
      entity: testResult.entity,
      action: testResult.action,
      scenarioName: testResult.scenarioName,
      result: testResult.result,
      error: testResult.error,
      screenshots: testResult.screenshots || [],
      details: {
        ...testResult
      }
    };

    this.sessionData.tests.push(test);
    this.updateSummary();
    this.saveSession();

    console.log(`📝 Recorded test: ${test.name} (${test.status})`);
    return test;
  }

  /**
   * Record a screenshot
   */
  recordScreenshot(screenshotInfo) {
    const screenshot = {
      id: `screenshot_${Date.now()}`,
      timestamp: new Date().toISOString(),
      ...screenshotInfo
    };

    this.sessionData.screenshots.push(screenshot);
    this.sessionData.summary.totalScreenshots = this.sessionData.screenshots.length;
    this.saveSession();

    return screenshot;
  }

  /**
   * Update session summary statistics
   */
  updateSummary() {
    const tests = this.sessionData.tests;
    
    this.sessionData.summary = {
      totalTests: tests.length,
      passedTests: tests.filter(t => t.status === 'passed').length,
      failedTests: tests.filter(t => t.status === 'failed').length,
      totalScreenshots: this.sessionData.screenshots.length,
      duration: tests.reduce((sum, test) => sum + (test.duration || 0), 0)
    };

    this.sessionData.lastUpdated = new Date().toISOString();
  }

  /**
   * Save session to file
   */
  saveSession() {
    try {
      fs.writeFileSync(this.sessionFile, JSON.stringify(this.sessionData, null, 2));
    } catch (error) {
      console.error(`❌ Failed to save session ${this.sessionId}: ${error.message}`);
    }
  }

  /**
   * Get current session data
   */
  getSessionData() {
    return { ...this.sessionData };
  }

  /**
   * Get session summary
   */
  getSummary() {
    return { ...this.sessionData.summary };
  }

  /**
   * Get all tests
   */
  getTests() {
    return [...this.sessionData.tests];
  }

  /**
   * Get all screenshots
   */
  getScreenshots() {
    return [...this.sessionData.screenshots];
  }
  
  /**
   * Get objectives data
   */
  getObjectives() {
    return this.sessionData.objectives ? { ...this.sessionData.objectives } : null;
  }
  
  /**
   * Update objectives data
   */
  updateObjectives(objectivesData) {
    this.sessionData.objectives = objectivesData;
    this.sessionData.lastUpdated = new Date().toISOString();
    this.saveSession();
    
    console.log(`📝 Updated objectives tracking: ${objectivesData?.summary?.total || 0} total objectives`);
  }

  /**
   * Link test result to objectives for better reporting
   */
  linkTestToObjectives(testResult, objectiveIds = []) {
    if (objectiveIds.length > 0 && this.sessionData.objectives) {
      // Track which tests contributed to which objectives
      if (!this.sessionData.objectives.testMapping) {
        this.sessionData.objectives.testMapping = {};
      }
      
      objectiveIds.forEach(objId => {
        if (!this.sessionData.objectives.testMapping[objId]) {
          this.sessionData.objectives.testMapping[objId] = [];
        }
        this.sessionData.objectives.testMapping[objId].push(testResult.id || testResult.name);
      });
      
      this.saveSession();
    }
  }

  /**
   * Close session and finalize
   */
  closeSession() {
    this.sessionData.endTime = new Date().toISOString();
    this.sessionData.status = 'completed';
    this.saveSession();

    console.log(`🏁 Session ${this.sessionId} closed with ${this.sessionData.summary.totalTests} tests`);
    return this.sessionData;
  }

  /**
   * Get the current active session ID or create a new one
   */
  static getCurrentSessionId() {
    const sessionDir = '/mnt/c/projects/vrp-system/v4/uat/sessions';
    const activeSessionFile = path.join(sessionDir, 'active-session.txt');

    if (fs.existsSync(activeSessionFile)) {
      try {
        const sessionId = fs.readFileSync(activeSessionFile, 'utf8').trim();
        if (sessionId) {
          return sessionId;
        }
      } catch (error) {
        console.warn('⚠️ Could not read active session file');
      }
    }

    // Create new session
    const newSession = new UATTestSession();
    UATTestSession.setActiveSession(newSession.sessionId);
    return newSession.sessionId;
  }

  /**
   * Set the active session ID
   */
  static setActiveSession(sessionId) {
    const sessionDir = '/mnt/c/projects/vrp-system/v4/uat/sessions';
    const activeSessionFile = path.join(sessionDir, 'active-session.txt');

    // Ensure directory exists
    if (!fs.existsSync(sessionDir)) {
      fs.mkdirSync(sessionDir, { recursive: true });
    }

    fs.writeFileSync(activeSessionFile, sessionId);
  }

  /**
   * Get or create the current active session
   */
  static getActiveSession() {
    const sessionId = UATTestSession.getCurrentSessionId();
    return new UATTestSession(sessionId);
  }

  /**
   * List all sessions
   */
  static listSessions() {
    const sessionDir = '/mnt/c/projects/vrp-system/v4/uat/sessions';
    
    if (!fs.existsSync(sessionDir)) {
      return [];
    }

    const sessions = [];
    const files = fs.readdirSync(sessionDir)
      .filter(file => file.startsWith('session-') && file.endsWith('.json'))
      .sort()
      .reverse(); // Most recent first

    for (const file of files) {
      try {
        const content = fs.readFileSync(path.join(sessionDir, file), 'utf8');
        const session = JSON.parse(content);
        sessions.push({
          sessionId: session.sessionId,
          startTime: session.startTime,
          endTime: session.endTime,
          status: session.status || 'active',
          summary: session.summary
        });
      } catch (error) {
        console.warn(`⚠️ Could not read session file ${file}: ${error.message}`);
      }
    }

    return sessions;
  }

  /**
   * Clean up old sessions (keep last 10)
   */
  static cleanupOldSessions() {
    const sessionDir = '/mnt/c/projects/vrp-system/v4/uat/sessions';
    
    if (!fs.existsSync(sessionDir)) {
      return;
    }

    const files = fs.readdirSync(sessionDir)
      .filter(file => file.startsWith('session-') && file.endsWith('.json'))
      .sort()
      .reverse();

    // Keep only the 10 most recent sessions
    const filesToDelete = files.slice(10);
    
    for (const file of filesToDelete) {
      try {
        fs.unlinkSync(path.join(sessionDir, file));
        console.log(`🗑️ Cleaned up old session: ${file}`);
      } catch (error) {
        console.warn(`⚠️ Could not delete session file ${file}: ${error.message}`);
      }
    }
  }
}

module.exports = UATTestSession;