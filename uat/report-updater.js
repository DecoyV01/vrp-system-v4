#!/usr/bin/env node

/**
 * UAT Report Updater - Updates reports with test execution results
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { UATReportGenerator } from './report-generator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class UATReportUpdater {
    constructor() {
        this.reportsDir = path.join(__dirname, 'reports');
        this.screenshotsDir = path.join(__dirname, 'screenshots');
        this.reportGenerator = new UATReportGenerator();
    }

    /**
     * Update report with test execution results
     */
    async updateReport(sessionId, testResults) {
        const sessionReportsDir = path.join(this.reportsDir, sessionId);
        const reportPath = path.join(sessionReportsDir, 'uat-report.json');
        
        if (!fs.existsSync(reportPath)) {
            throw new Error(`Report not found for session: ${sessionId}`);
        }

        // Load existing report
        const existingReport = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
        
        // Load execution plan
        const executionPlan = {
            sessionId,
            scenario: existingReport.metadata.scenario,
            description: existingReport.metadata.description,
            startTime: existingReport.metadata.startTime,
            sessionScreenshotsDir: path.join(this.screenshotsDir, sessionId),
            sessionReportsDir,
            objectives: existingReport.objectives?.objectives || [],
            steps: existingReport.execution.steps.map(step => ({
                stepNumber: step.stepNumber,
                mcpCall: {
                    description: step.description,
                    tool: step.tool,
                    validation: step.validation
                }
            }))
        };

        // Generate updated report
        const { jsonReport, markdownReport } = await this.reportGenerator.generateReport(executionPlan, testResults);
        
        console.log(`📊 Updated report for session: ${sessionId}`);
        console.log(`   JSON: ${jsonReport}`);
        console.log(`   Markdown: ${markdownReport}`);
        
        return { jsonReport, markdownReport };
    }

    /**
     * Mark step as completed
     */
    async markStepCompleted(sessionId, stepNumber, duration = null) {
        const sessionReportsDir = path.join(this.reportsDir, sessionId);
        const reportPath = path.join(sessionReportsDir, 'uat-report.json');
        
        if (!fs.existsSync(reportPath)) {
            console.warn(`Report not found for session: ${sessionId}`);
            return;
        }

        try {
            const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
            
            // Update step status
            const step = report.execution.steps.find(s => s.stepNumber == stepNumber);
            if (step) {
                step.status = 'completed';
                step.timestamp = new Date().toISOString();
                if (duration) step.duration = duration;
            }

            // Update summary
            const completedSteps = report.execution.steps.filter(s => s.status === 'completed').length;
            const failedSteps = report.execution.steps.filter(s => s.status === 'failed').length;
            
            report.summary.completedSteps = completedSteps;
            report.summary.failedSteps = failedSteps;
            report.summary.successRate = Math.round((completedSteps / report.summary.totalSteps) * 100);
            
            // Check if all steps completed
            if (completedSteps + failedSteps === report.summary.totalSteps) {
                report.summary.status = failedSteps > 0 ? 'completed_with_failures' : 'completed';
                report.metadata.endTime = new Date().toISOString();
                report.metadata.duration = this.calculateDuration(report.metadata.startTime, report.metadata.endTime);
            }

            // Save updated report
            fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
            
            // Regenerate markdown
            const executionPlan = this.extractExecutionPlan(report);
            const testResults = this.extractTestResults(report);
            await this.reportGenerator.generateReport(executionPlan, testResults);
            
            console.log(`✅ Step ${stepNumber} marked as completed`);
            
        } catch (error) {
            console.error(`Failed to update step: ${error.message}`);
        }
    }

    /**
     * Generate final report with all results
     */
    async generateFinalReport(sessionId) {
        const sessionReportsDir = path.join(this.reportsDir, sessionId);
        const reportPath = path.join(sessionReportsDir, 'uat-report.json');
        
        if (!fs.existsSync(reportPath)) {
            throw new Error(`Report not found for session: ${sessionId}`);
        }

        const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
        
        // Mark as completed
        report.summary.status = 'completed';
        report.metadata.endTime = new Date().toISOString();
        report.metadata.duration = this.calculateDuration(report.metadata.startTime, report.metadata.endTime);
        
        // Update objectives based on step completion
        if (report.objectives?.objectives) {
            report.objectives.objectives.forEach(objective => {
                const relatedSteps = report.execution.steps.filter(step => 
                    objective.steps?.some(stepName => step.description.toLowerCase().includes(stepName))
                );
                
                if (relatedSteps.length > 0) {
                    const completedRelated = relatedSteps.filter(step => step.status === 'completed').length;
                    objective.progress = Math.round((completedRelated / relatedSteps.length) * 100);
                    objective.status = objective.progress === 100 ? 'completed' : 
                                     objective.progress > 0 ? 'in_progress' : 'pending';
                }
            });
            
            const completedObjectives = report.objectives.objectives.filter(obj => obj.status === 'completed').length;
            report.objectives.completed = completedObjectives;
            report.objectives.completionRate = Math.round((completedObjectives / report.objectives.total) * 100);
        }

        // Save final report
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        // Regenerate markdown with final results
        const executionPlan = this.extractExecutionPlan(report);
        const testResults = this.extractTestResults(report);
        const { markdownReport } = await this.reportGenerator.generateReport(executionPlan, testResults);
        
        console.log(`🎯 Final report generated for session: ${sessionId}`);
        console.log(`   Report: ${markdownReport}`);
        
        return markdownReport;
    }

    /**
     * Extract execution plan from report
     */
    extractExecutionPlan(report) {
        return {
            sessionId: report.metadata.sessionId,
            scenario: report.metadata.scenario,
            description: report.metadata.description,
            startTime: report.metadata.startTime,
            sessionScreenshotsDir: path.join(this.screenshotsDir, report.metadata.sessionId),
            sessionReportsDir: path.join(this.reportsDir, report.metadata.sessionId),
            objectives: report.objectives?.objectives || [],
            steps: report.execution.steps.map(step => ({
                stepNumber: step.stepNumber,
                mcpCall: {
                    description: step.description,
                    tool: step.tool,
                    validation: step.validation
                }
            }))
        };
    }

    /**
     * Extract test results from report
     */
    extractTestResults(report) {
        return {
            status: report.summary.status,
            completedSteps: report.summary.completedSteps,
            failedSteps: report.summary.failedSteps,
            startTime: report.metadata.startTime,
            endTime: report.metadata.endTime,
            stepResults: report.execution.steps.map(step => ({
                status: step.status,
                timestamp: step.timestamp,
                duration: step.duration
            })),
            objectiveResults: report.objectives?.objectives?.reduce((acc, obj) => {
                acc[obj.id] = {
                    status: obj.status,
                    progress: obj.progress
                };
                return acc;
            }, {}) || {}
        };
    }

    /**
     * Calculate duration
     */
    calculateDuration(startTime, endTime) {
        if (!endTime) return 'N/A';
        
        const start = new Date(startTime);
        const end = new Date(endTime);
        const diffMs = end - start;
        
        const minutes = Math.floor(diffMs / 60000);
        const seconds = Math.floor((diffMs % 60000) / 1000);
        
        return `${minutes}m ${seconds}s`;
    }

    /**
     * List active sessions
     */
    listActiveSessions() {
        if (!fs.existsSync(this.reportsDir)) {
            console.log('No UAT sessions found');
            return [];
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
                    scenario: report.metadata.scenario,
                    status: report.summary.status,
                    startTime: report.metadata.startTime,
                    completedSteps: report.summary.completedSteps,
                    totalSteps: report.summary.totalSteps
                };
            })
            .sort((a, b) => new Date(b.startTime) - new Date(a.startTime));

        console.log('📋 UAT Sessions:');
        console.log('');
        sessions.forEach(session => {
            const statusEmoji = session.status === 'completed' ? '✅' : 
                               session.status === 'completed_with_failures' ? '⚠️' : 
                               session.status === 'in_progress' ? '🔄' : '⏳';
            console.log(`${statusEmoji} ${session.sessionId} - ${session.scenario}`);
            console.log(`   Status: ${session.status} (${session.completedSteps}/${session.totalSteps} steps)`);
            console.log(`   Started: ${new Date(session.startTime).toLocaleString()}`);
            console.log('');
        });

        return sessions;
    }
}

// CLI interface
async function main() {
    const updater = new UATReportUpdater();
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log('UAT Report Updater');
        console.log('');
        console.log('Usage:');
        console.log('  node report-updater.js list                      List all sessions');
        console.log('  node report-updater.js complete <session-id>     Mark session as completed');
        console.log('  node report-updater.js step <session-id> <step#> Mark step as completed');
        console.log('');
        return;
    }
    
    const command = args[0];
    
    switch (command) {
        case 'list':
            updater.listActiveSessions();
            break;
            
        case 'complete':
            if (args[1]) {
                await updater.generateFinalReport(args[1]);
            } else {
                console.error('Session ID required');
            }
            break;
            
        case 'step':
            if (args[1] && args[2]) {
                await updater.markStepCompleted(args[1], args[2]);
            } else {
                console.error('Session ID and step number required');
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

export { UATReportUpdater };