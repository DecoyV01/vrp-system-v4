#!/usr/bin/env node

/**
 * Auto Report Tracker - Automatically tracks and updates UAT reports during execution
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { UATReportUpdater } from './report-updater.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class AutoReportTracker {
    constructor() {
        this.reportsDir = path.join(__dirname, 'reports');
        this.screenshotsDir = path.join(__dirname, 'screenshots');
        this.updater = new UATReportUpdater();
        this.currentSession = null;
        this.currentStep = 0;
    }

    /**
     * Start tracking a UAT session
     */
    startSession(sessionId) {
        this.currentSession = sessionId;
        this.currentStep = 0;
        
        console.log(`🎯 Started tracking UAT session: ${sessionId}`);
        
        // Create a tracking file to monitor progress
        const trackingFile = path.join(this.reportsDir, sessionId, 'tracking.json');
        const trackingData = {
            sessionId,
            startTime: new Date().toISOString(),
            currentStep: 0,
            autoTracking: true
        };
        
        fs.writeFileSync(trackingFile, JSON.stringify(trackingData, null, 2));
        
        return trackingData;
    }

    /**
     * Mark next step as completed and update report
     */
    async markNextStepCompleted() {
        if (!this.currentSession) {
            console.warn('No active UAT session for tracking');
            return;
        }

        this.currentStep++;
        
        try {
            await this.updater.markStepCompleted(this.currentSession, this.currentStep);
            
            // Update tracking file
            const trackingFile = path.join(this.reportsDir, this.currentSession, 'tracking.json');
            if (fs.existsSync(trackingFile)) {
                const trackingData = JSON.parse(fs.readFileSync(trackingFile, 'utf8'));
                trackingData.currentStep = this.currentStep;
                trackingData.lastUpdate = new Date().toISOString();
                fs.writeFileSync(trackingFile, JSON.stringify(trackingData, null, 2));
            }
            
            console.log(`✅ Step ${this.currentStep} completed and report updated`);
            
        } catch (error) {
            console.error(`Failed to update step ${this.currentStep}: ${error.message}`);
        }
    }

    /**
     * Complete the session and generate final report
     */
    async completeSession() {
        if (!this.currentSession) {
            console.warn('No active UAT session to complete');
            return;
        }

        try {
            const finalReport = await this.updater.generateFinalReport(this.currentSession);
            
            // Update tracking file
            const trackingFile = path.join(this.reportsDir, this.currentSession, 'tracking.json');
            if (fs.existsSync(trackingFile)) {
                const trackingData = JSON.parse(fs.readFileSync(trackingFile, 'utf8'));
                trackingData.status = 'completed';
                trackingData.endTime = new Date().toISOString();
                fs.writeFileSync(trackingFile, JSON.stringify(trackingData, null, 2));
            }
            
            console.log(`🎯 Session ${this.currentSession} completed with final report`);
            
            // Reset tracking
            this.currentSession = null;
            this.currentStep = 0;
            
            return finalReport;
            
        } catch (error) {
            console.error(`Failed to complete session: ${error.message}`);
        }
    }

    /**
     * Get current session status
     */
    getSessionStatus() {
        if (!this.currentSession) {
            return { active: false };
        }

        const trackingFile = path.join(this.reportsDir, this.currentSession, 'tracking.json');
        if (fs.existsSync(trackingFile)) {
            const trackingData = JSON.parse(fs.readFileSync(trackingFile, 'utf8'));
            return { 
                active: true, 
                sessionId: this.currentSession,
                currentStep: this.currentStep,
                ...trackingData
            };
        }

        return { 
            active: true, 
            sessionId: this.currentSession,
            currentStep: this.currentStep
        };
    }

    /**
     * Auto-detect and load the latest session
     */
    loadLatestSession() {
        if (!fs.existsSync(this.reportsDir)) {
            return null;
        }

        const sessions = fs.readdirSync(this.reportsDir)
            .filter(dir => {
                const reportPath = path.join(this.reportsDir, dir, 'uat-report.json');
                return fs.existsSync(reportPath);
            })
            .map(sessionId => {
                const reportPath = path.join(this.reportsDir, sessionId, 'uat-report.json');
                const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
                return {
                    sessionId,
                    startTime: report.metadata.startTime,
                    status: report.summary.status
                };
            })
            .sort((a, b) => new Date(b.startTime) - new Date(a.startTime));

        if (sessions.length > 0) {
            const latestSession = sessions[0];
            
            // Only load if it's in progress
            if (latestSession.status === 'in_progress') {
                this.currentSession = latestSession.sessionId;
                
                // Load current step from tracking
                const trackingFile = path.join(this.reportsDir, latestSession.sessionId, 'tracking.json');
                if (fs.existsSync(trackingFile)) {
                    const trackingData = JSON.parse(fs.readFileSync(trackingFile, 'utf8'));
                    this.currentStep = trackingData.currentStep || 0;
                }
                
                console.log(`🔄 Resumed tracking session: ${this.currentSession} (step ${this.currentStep})`);
                return latestSession;
            }
        }

        return null;
    }
}

// CLI interface for manual control
async function main() {
    const tracker = new AutoReportTracker();
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log('Auto Report Tracker');
        console.log('');
        console.log('Usage:');
        console.log('  node auto-report-tracker.js start <session-id>    Start tracking session');
        console.log('  node auto-report-tracker.js next                  Mark next step completed');
        console.log('  node auto-report-tracker.js complete              Complete current session');
        console.log('  node auto-report-tracker.js status                Show current status');
        console.log('  node auto-report-tracker.js auto                  Auto-detect latest session');
        console.log('');
        return;
    }
    
    const command = args[0];
    
    switch (command) {
        case 'start':
            if (args[1]) {
                tracker.startSession(args[1]);
            } else {
                console.error('Session ID required');
            }
            break;
            
        case 'next':
            await tracker.markNextStepCompleted();
            break;
            
        case 'complete':
            await tracker.completeSession();
            break;
            
        case 'status':
            const status = tracker.getSessionStatus();
            console.log('Current Status:', status);
            break;
            
        case 'auto':
            const session = tracker.loadLatestSession();
            if (session) {
                console.log('Loaded session:', session);
            } else {
                console.log('No active session found');
            }
            break;
            
        default:
            console.error(`Unknown command: ${command}`);
            break;
    }
}

if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(error => {
        console.error('Error:', error.message);
        process.exit(1);
    });
}

export { AutoReportTracker };