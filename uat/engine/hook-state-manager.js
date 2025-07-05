#!/usr/bin/env node
/**
 * UAT Hook State Manager
 * 
 * Centralized state management system for hook communication and session tracking.
 * Provides atomic read/write operations with file locking and error recovery.
 * 
 * Usage from bash hooks:
 *   node hook-state-manager.js read-state
 *   node hook-state-manager.js update-state '{"currentStep": 3}'
 *   node hook-state-manager.js add-step '{"action": "navigate", "status": "completed"}'
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

class HookStateManager {
    constructor() {
        this.uatRoot = process.env.UAT_ROOT || path.resolve(__dirname, '..');
        this.sessionStateFile = path.join(this.uatRoot, 'sessions', 'hook-active-session.json');
        this.lockFile = this.sessionStateFile + '.lock';
        this.backupFile = this.sessionStateFile + '.backup';
        this.maxLockWaitTime = 5000; // 5 seconds
        this.lockCheckInterval = 100; // 100ms
    }

    /**
     * Acquire file lock with timeout
     */
    async acquireLock() {
        const startTime = Date.now();
        
        while (Date.now() - startTime < this.maxLockWaitTime) {
            try {
                // Try to create lock file exclusively
                fs.writeFileSync(this.lockFile, process.pid.toString(), { flag: 'wx' });
                return true;
            } catch (error) {
                if (error.code === 'EEXIST') {
                    // Check if lock is stale (process no longer exists)
                    try {
                        const lockPid = fs.readFileSync(this.lockFile, 'utf8').trim();
                        const pid = parseInt(lockPid);
                        
                        // Check if process is still running
                        try {
                            process.kill(pid, 0); // Signal 0 checks if process exists
                        } catch (killError) {
                            if (killError.code === 'ESRCH') {
                                // Process doesn't exist, remove stale lock
                                fs.unlinkSync(this.lockFile);
                                continue;
                            }
                        }
                    } catch (readError) {
                        // Invalid lock file, remove it
                        try {
                            fs.unlinkSync(this.lockFile);
                        } catch (unlinkError) {
                            // Ignore errors when removing invalid lock
                        }
                        continue;
                    }
                    
                    // Wait and retry
                    await new Promise(resolve => setTimeout(resolve, this.lockCheckInterval));
                } else {
                    throw error;
                }
            }
        }
        
        throw new Error(`Failed to acquire lock within ${this.maxLockWaitTime}ms`);
    }

    /**
     * Release file lock
     */
    releaseLock() {
        try {
            fs.unlinkSync(this.lockFile);
        } catch (error) {
            // Ignore errors when releasing lock
        }
    }

    /**
     * Create backup of current state
     */
    createBackup() {
        try {
            if (fs.existsSync(this.sessionStateFile)) {
                fs.copyFileSync(this.sessionStateFile, this.backupFile);
            }
        } catch (error) {
            console.warn('Failed to create backup:', error.message);
        }
    }

    /**
     * Restore from backup
     */
    restoreFromBackup() {
        try {
            if (fs.existsSync(this.backupFile)) {
                fs.copyFileSync(this.backupFile, this.sessionStateFile);
                return true;
            }
        } catch (error) {
            console.error('Failed to restore from backup:', error.message);
        }
        return false;
    }

    /**
     * Read session state with atomic operation
     */
    async readState() {
        await this.acquireLock();
        
        try {
            if (!fs.existsSync(this.sessionStateFile)) {
                throw new Error('Session state file not found. Run uat-init-session.sh first.');
            }
            
            const stateData = fs.readFileSync(this.sessionStateFile, 'utf8');
            const state = JSON.parse(stateData);
            
            // Validate state structure
            this.validateState(state);
            
            return state;
        } catch (error) {
            // Try to restore from backup on corruption
            if (error instanceof SyntaxError) {
                console.warn('State file corrupted, attempting restore from backup...');
                if (this.restoreFromBackup()) {
                    const backupData = fs.readFileSync(this.sessionStateFile, 'utf8');
                    return JSON.parse(backupData);
                }
            }
            throw error;
        } finally {
            this.releaseLock();
        }
    }

    /**
     * Write session state with atomic operation
     */
    async writeState(state) {
        await this.acquireLock();
        
        try {
            // Validate state before writing
            this.validateState(state);
            
            // Create backup before modifying
            this.createBackup();
            
            // Write to temporary file first
            const tempFile = this.sessionStateFile + '.tmp';
            fs.writeFileSync(tempFile, JSON.stringify(state, null, 2), 'utf8');
            
            // Atomic move
            fs.renameSync(tempFile, this.sessionStateFile);
            
        } finally {
            this.releaseLock();
        }
    }

    /**
     * Update session state with partial data
     */
    async updateState(updates) {
        const currentState = await this.readState();
        const newState = { ...currentState, ...updates };
        
        // Update timestamp
        newState.lastActivity = new Date().toISOString();
        
        await this.writeState(newState);
        return newState;
    }

    /**
     * Add step execution result to session
     */
    async addStep(stepData) {
        const currentState = await this.readState();
        
        const step = {
            stepNumber: currentState.currentStep + 1,
            timestamp: new Date().toISOString(),
            ...stepData
        };
        
        currentState.steps.push(step);
        currentState.currentStep = step.stepNumber;
        currentState.lastActivity = new Date().toISOString();
        
        await this.writeState(currentState);
        return currentState;
    }

    /**
     * Add validation result
     */
    async addValidationResult(validationData) {
        const currentState = await this.readState();
        
        const validation = {
            timestamp: new Date().toISOString(),
            stepNumber: currentState.currentStep,
            ...validationData
        };
        
        currentState.validationResults.push(validation);
        currentState.lastActivity = new Date().toISOString();
        
        await this.writeState(currentState);
        return currentState;
    }

    /**
     * Add screenshot record
     */
    async addScreenshot(screenshotData) {
        const currentState = await this.readState();
        
        const screenshot = {
            timestamp: new Date().toISOString(),
            stepNumber: currentState.currentStep,
            sessionId: currentState.sessionId,
            ...screenshotData
        };
        
        currentState.screenshots.push(screenshot);
        currentState.lastActivity = new Date().toISOString();
        
        await this.writeState(currentState);
        return currentState;
    }

    /**
     * Add error record
     */
    async addError(errorData) {
        const currentState = await this.readState();
        
        const error = {
            timestamp: new Date().toISOString(),
            stepNumber: currentState.currentStep,
            ...errorData
        };
        
        currentState.errors.push(error);
        currentState.lastActivity = new Date().toISOString();
        
        await this.writeState(currentState);
        return currentState;
    }

    /**
     * Update performance metrics
     */
    async updatePerformance(perfData) {
        const currentState = await this.readState();
        
        if (!currentState.performance) {
            currentState.performance = { stepTimes: [] };
        }
        
        currentState.performance = { ...currentState.performance, ...perfData };
        currentState.lastActivity = new Date().toISOString();
        
        await this.writeState(currentState);
        return currentState;
    }

    /**
     * Mark session as completed
     */
    async completeSession(finalData = {}) {
        const currentState = await this.readState();
        
        currentState.status = 'completed';
        currentState.endTime = new Date().toISOString();
        currentState.lastActivity = new Date().toISOString();
        
        // Calculate total duration
        if (currentState.startTime) {
            const startTime = new Date(currentState.startTime).getTime();
            const endTime = new Date(currentState.endTime).getTime();
            currentState.duration = endTime - startTime;
        }
        
        // Add any final data
        Object.assign(currentState, finalData);
        
        await this.writeState(currentState);
        return currentState;
    }

    /**
     * Archive session and clean up
     */
    async archiveSession() {
        const currentState = await this.readState();
        
        // Create archive directory
        const archiveDir = path.join(this.uatRoot, 'sessions', 'archive');
        if (!fs.existsSync(archiveDir)) {
            fs.mkdirSync(archiveDir, { recursive: true });
        }
        
        // Move session file to archive
        const archiveFile = path.join(archiveDir, `session-${currentState.sessionId}.json`);
        fs.copyFileSync(this.sessionStateFile, archiveFile);
        
        // Remove active session file
        fs.unlinkSync(this.sessionStateFile);
        
        // Clean up backup and lock files
        try {
            if (fs.existsSync(this.backupFile)) fs.unlinkSync(this.backupFile);
            if (fs.existsSync(this.lockFile)) fs.unlinkSync(this.lockFile);
        } catch (error) {
            // Ignore cleanup errors
        }
        
        return archiveFile;
    }

    /**
     * Validate state structure
     */
    validateState(state) {
        const requiredFields = [
            'sessionId', 'scenarioName', 'mode', 'status', 'currentStep', 'totalSteps'
        ];
        
        for (const field of requiredFields) {
            if (!(field in state)) {
                throw new Error(`Invalid state: missing required field '${field}'`);
            }
        }
        
        // Validate arrays
        const arrayFields = ['steps', 'validationResults', 'screenshots', 'errors'];
        for (const field of arrayFields) {
            if (state[field] && !Array.isArray(state[field])) {
                throw new Error(`Invalid state: '${field}' must be an array`);
            }
        }
        
        // Validate step number
        if (typeof state.currentStep !== 'number' || state.currentStep < 0) {
            throw new Error('Invalid state: currentStep must be a non-negative number');
        }
        
        if (typeof state.totalSteps !== 'number' || state.totalSteps < 0) {
            throw new Error('Invalid state: totalSteps must be a non-negative number');
        }
    }

    /**
     * Get session statistics
     */
    async getStatistics() {
        const state = await this.readState();
        
        const stats = {
            sessionId: state.sessionId,
            scenarioName: state.scenarioName,
            status: state.status,
            progress: {
                currentStep: state.currentStep,
                totalSteps: state.totalSteps,
                percentage: state.totalSteps > 0 ? Math.round((state.currentStep / state.totalSteps) * 100) : 0
            },
            timing: {
                startTime: state.startTime,
                lastActivity: state.lastActivity,
                duration: state.duration || null
            },
            counts: {
                steps: state.steps.length,
                validations: state.validationResults.length,
                screenshots: state.screenshots.length,
                errors: state.errors.length
            }
        };
        
        return stats;
    }
}

// Command line interface
async function main() {
    const manager = new HookStateManager();
    const command = process.argv[2];
    const data = process.argv[3];

    try {
        switch (command) {
            case 'read-state':
                const state = await manager.readState();
                console.log(JSON.stringify(state, null, 2));
                break;

            case 'update-state':
                if (!data) throw new Error('Update data required');
                const updates = JSON.parse(data);
                const newState = await manager.updateState(updates);
                console.log(JSON.stringify(newState, null, 2));
                break;

            case 'add-step':
                if (!data) throw new Error('Step data required');
                const stepData = JSON.parse(data);
                const stateWithStep = await manager.addStep(stepData);
                console.log(JSON.stringify(stateWithStep, null, 2));
                break;

            case 'add-validation':
                if (!data) throw new Error('Validation data required');
                const validationData = JSON.parse(data);
                const stateWithValidation = await manager.addValidationResult(validationData);
                console.log(JSON.stringify(stateWithValidation, null, 2));
                break;

            case 'add-screenshot':
                if (!data) throw new Error('Screenshot data required');
                const screenshotData = JSON.parse(data);
                const stateWithScreenshot = await manager.addScreenshot(screenshotData);
                console.log(JSON.stringify(stateWithScreenshot, null, 2));
                break;

            case 'add-error':
                if (!data) throw new Error('Error data required');
                const errorData = JSON.parse(data);
                const stateWithError = await manager.addError(errorData);
                console.log(JSON.stringify(stateWithError, null, 2));
                break;

            case 'update-performance':
                if (!data) throw new Error('Performance data required');
                const perfData = JSON.parse(data);
                const stateWithPerf = await manager.updatePerformance(perfData);
                console.log(JSON.stringify(stateWithPerf, null, 2));
                break;

            case 'complete-session':
                const finalData = data ? JSON.parse(data) : {};
                const completedState = await manager.completeSession(finalData);
                console.log(JSON.stringify(completedState, null, 2));
                break;

            case 'archive-session':
                const archiveFile = await manager.archiveSession();
                console.log(JSON.stringify({ archived: true, file: archiveFile }));
                break;

            case 'get-statistics':
                const stats = await manager.getStatistics();
                console.log(JSON.stringify(stats, null, 2));
                break;

            case 'validate':
                await manager.readState(); // This will validate the state
                console.log(JSON.stringify({ valid: true }));
                break;

            default:
                console.error('Usage: node hook-state-manager.js <command> [data]');
                console.error('Commands:');
                console.error('  read-state                     - Read current session state');
                console.error('  update-state <json>           - Update session state');
                console.error('  add-step <json>               - Add step execution result');
                console.error('  add-validation <json>         - Add validation result');
                console.error('  add-screenshot <json>         - Add screenshot record');
                console.error('  add-error <json>              - Add error record');
                console.error('  update-performance <json>     - Update performance metrics');
                console.error('  complete-session [json]       - Mark session as completed');
                console.error('  archive-session               - Archive and clean up session');
                console.error('  get-statistics                - Get session statistics');
                console.error('  validate                      - Validate current state');
                process.exit(1);
        }
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

// Export for use as module
module.exports = HookStateManager;

// Run CLI if called directly
if (require.main === module) {
    main().catch(error => {
        console.error('Fatal error:', error.message);
        process.exit(1);
    });
}