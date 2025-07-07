#!/usr/bin/env node

/**
 * UAT Report Generator - Creates comprehensive reports for UAT test sessions
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class UATReportGenerator {
    constructor() {
        this.reportsDir = path.join(__dirname, 'reports');
        this.screenshotsDir = path.join(__dirname, 'screenshots');
    }

    /**
     * Generate comprehensive UAT report
     */
    async generateReport(executionPlan, testResults = {}) {
        const report = {
            metadata: {
                generatedAt: new Date().toISOString(),
                sessionId: executionPlan.sessionId,
                scenario: executionPlan.scenario,
                description: executionPlan.description,
                startTime: executionPlan.startTime,
                endTime: testResults.endTime || new Date().toISOString(),
                duration: this.calculateDuration(executionPlan.startTime, testResults.endTime),
                framework: 'VRP System UAT Framework v3.0.0 - Simplified Architecture'
            },
            summary: {
                totalSteps: executionPlan.steps.length,
                completedSteps: testResults.completedSteps || 0,
                failedSteps: testResults.failedSteps || 0,
                successRate: this.calculateSuccessRate(
                    executionPlan.steps.length, 
                    testResults.completedSteps || 0,
                    testResults.failedSteps || 0
                ),
                status: testResults.status || 'completed'
            },
            objectives: this.processObjectives(executionPlan.objectives, testResults.objectiveResults),
            execution: {
                steps: executionPlan.steps.map((step, index) => ({
                    stepNumber: step.stepNumber,
                    description: step.mcpCall.description,
                    tool: step.mcpCall.tool,
                    status: testResults.stepResults?.[index]?.status || 'pending',
                    timestamp: testResults.stepResults?.[index]?.timestamp,
                    duration: testResults.stepResults?.[index]?.duration,
                    validation: step.mcpCall.validation
                }))
            },
            artifacts: {
                screenshots: this.collectScreenshots(executionPlan.sessionId),
                logs: testResults.logs || [],
                sessionDirectory: executionPlan.sessionScreenshotsDir
            },
            methodology: {
                framework: 'VERA (Verify, Execute, Record, Analyze)',
                phases: [
                    'Verify: Environment and state validation',
                    'Execute: Test scenario step execution',
                    'Record: Screenshot and data capture',
                    'Analyze: Results validation and reporting'
                ]
            }
        };

        // Save JSON report
        const jsonReportPath = path.join(executionPlan.sessionReportsDir, 'uat-report.json');
        fs.writeFileSync(jsonReportPath, JSON.stringify(report, null, 2));

        // Generate markdown report
        const markdownReport = this.generateMarkdownReport(report);
        const mdReportPath = path.join(executionPlan.sessionReportsDir, 'uat-report.md');
        fs.writeFileSync(mdReportPath, markdownReport);

        return {
            jsonReport: jsonReportPath,
            markdownReport: mdReportPath,
            report
        };
    }

    /**
     * Process objectives tracking
     */
    processObjectives(objectives, objectiveResults = {}) {
        if (!objectives || objectives.length === 0) {
            return { hasObjectives: false, summary: 'No specific objectives defined' };
        }

        const processed = objectives.map(objective => ({
            id: objective.id,
            title: objective.title,
            description: objective.description,
            category: objective.category,
            priority: objective.priority,
            status: objectiveResults[objective.id]?.status || 'pending',
            progress: objectiveResults[objective.id]?.progress || 0,
            acceptance_criteria: objective.acceptance_criteria || []
        }));

        const completed = processed.filter(obj => obj.status === 'completed').length;
        const total = processed.length;

        return {
            hasObjectives: true,
            total,
            completed,
            pending: total - completed,
            completionRate: Math.round((completed / total) * 100),
            objectives: processed
        };
    }

    /**
     * Collect screenshots for the session
     */
    collectScreenshots(sessionId) {
        const sessionScreenshotsDir = path.join(this.screenshotsDir, sessionId);
        
        if (!fs.existsSync(sessionScreenshotsDir)) {
            return [];
        }

        try {
            return fs.readdirSync(sessionScreenshotsDir)
                .filter(file => file.endsWith('.png'))
                .map(file => {
                    const filePath = path.join(sessionScreenshotsDir, file);
                    const stats = fs.statSync(filePath);
                    return {
                        filename: file,
                        path: `./screenshots/${sessionId}/${file}`,
                        size: stats.size,
                        timestamp: stats.mtime.toISOString()
                    };
                })
                .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        } catch (error) {
            return [];
        }
    }

    /**
     * Calculate test duration
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
     * Calculate success rate
     */
    calculateSuccessRate(total, completed, failed) {
        if (total === 0) return 0;
        return Math.round((completed / total) * 100);
    }

    /**
     * Generate markdown report
     */
    generateMarkdownReport(report) {
        const { metadata, summary, objectives, execution, artifacts } = report;

        return `# UAT Test Report: ${metadata.scenario}

## 📋 Test Summary

- **Session ID**: ${metadata.sessionId}
- **Scenario**: ${metadata.scenario}
- **Description**: ${metadata.description}
- **Generated**: ${new Date(metadata.generatedAt).toLocaleString()}
- **Duration**: ${metadata.duration}
- **Status**: ${summary.status.toUpperCase()}

## 📊 Execution Results

| Metric | Value |
|--------|--------|
| Total Steps | ${summary.totalSteps} |
| Completed Steps | ${summary.completedSteps} |
| Failed Steps | ${summary.failedSteps} |
| Success Rate | ${summary.successRate}% |

${objectives.hasObjectives ? `## 🎯 Objectives Dashboard

| Objective | Status | Progress | Priority | Category |
|-----------|--------|----------|----------|----------|
${objectives.objectives.map(obj => {
    const statusEmoji = obj.status === 'completed' ? '✅' : 
                       obj.status === 'failed' ? '❌' : 
                       obj.status === 'in_progress' ? '🔄' : '⏳';
    return `| ${obj.title} | ${statusEmoji} ${obj.status.toUpperCase()} | ${obj.progress}% | ${obj.priority} | ${obj.category} |`;
}).join('\n')}

**Objectives Summary**: ${objectives.completed}/${objectives.total} completed (${objectives.completionRate}%)` : ''}

## 🔄 Test Execution Steps

${execution.steps.map((step, index) => {
    const statusEmoji = step.status === 'completed' ? '✅' : 
                       step.status === 'failed' ? '❌' : 
                       step.status === 'in_progress' ? '🔄' : '⏳';
    return `### ${statusEmoji} Step ${step.stepNumber}: ${step.description}

- **Tool**: \`${step.tool}\`
- **Status**: ${step.status}
- **Validation**: ${step.validation.length} checks${step.validation.length > 0 ? ` required` : ''}
${step.timestamp ? `- **Executed**: ${new Date(step.timestamp).toLocaleString()}` : ''}
${step.duration ? `- **Duration**: ${step.duration}` : ''}`;
}).join('\n\n')}

## 📸 Screenshots

${artifacts.screenshots.length > 0 ? 
    artifacts.screenshots.map(screenshot => 
        `- **${screenshot.filename}** (${(screenshot.size / 1024).toFixed(1)} KB) - ${new Date(screenshot.timestamp).toLocaleString()}`
    ).join('\n') 
    : 'No screenshots captured'}

## 🔧 Technical Details

- **Framework**: ${metadata.framework}
- **Methodology**: ${report.methodology.framework}
- **Session Directory**: \`${artifacts.sessionDirectory}\`

### VERA Methodology Phases:
${report.methodology.phases.map(phase => `- ${phase}`).join('\n')}

---

*Generated by VRP System UAT Framework v3.0.0 - Simplified Architecture*
`;
    }
}

export { UATReportGenerator };