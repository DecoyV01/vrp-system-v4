#!/usr/bin/env node

/**
 * UAT Runner - Simplified Direct MCP Execution
 * 
 * This is the main entry point for the simplified UAT framework.
 * It loads scenario files and outputs exact MCP function calls for Claude Code to execute.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { UATReportGenerator } from './report-generator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class UATRunner {
    constructor() {
        this.scenariosDir = path.join(__dirname, 'scenarios');
        this.screenshotsDir = path.join(__dirname, 'screenshots');
        this.reportsDir = path.join(__dirname, 'reports');
        this.sessionTracker = null; // Will be initialized when needed
        this.reportGenerator = new UATReportGenerator();
        
        // Ensure directories exist
        this.ensureDirectories();
    }
    
    /**
     * Ensure required directories exist
     */
    ensureDirectories() {
        [this.screenshotsDir, this.reportsDir].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }

    /**
     * List available scenarios
     */
    async listScenarios() {
        console.log('📋 Available UAT Scenarios:');
        console.log('');
        
        try {
            const files = fs.readdirSync(this.scenariosDir)
                .filter(file => file.endsWith('.cjs'))
                .map(file => file.replace('.cjs', ''));
            
            for (const file of files) {
                try {
                    const scenarioPath = path.join(this.scenariosDir, `${file}.cjs`);
                    const scenario = (await import(`file://${scenarioPath}?t=${Date.now()}`)).default;
                    console.log(`  📄 ${file.padEnd(20)} ${scenario.description || 'No description'}`);
                } catch (error) {
                    console.log(`  ❌ ${file.padEnd(20)} (Error loading scenario)`);
                }
            }
            
            if (files.length === 0) {
                console.log('  No scenarios found');
            }
            
        } catch (error) {
            console.log('  ❌ Could not list scenarios:', error.message);
        }
        
        console.log('');
    }

    /**
     * Load and validate a scenario
     */
    async loadScenario(scenarioName) {
        const scenarioPath = path.join(this.scenariosDir, `${scenarioName}.cjs`);
        
        if (!fs.existsSync(scenarioPath)) {
            throw new Error(`Scenario not found: ${scenarioName}.cjs`);
        }
        
        try {
            // Dynamic import for ES modules
            const scenario = (await import(`file://${scenarioPath}?t=${Date.now()}`)).default;
            
            // Basic validation
            if (!scenario.name || !scenario.steps || !Array.isArray(scenario.steps)) {
                throw new Error(`Invalid scenario structure in ${scenarioName}.cjs`);
            }
            
            return scenario;
        } catch (error) {
            throw new Error(`Failed to load scenario ${scenarioName}: ${error.message}`);
        }
    }

    /**
     * Convert scenario step to MCP function call
     */
    stepToMCPCall(step, stepIndex, sessionId) {
        switch (step.action) {
            case 'navigate':
                return {
                    tool: 'mcp__playwright__playwright_navigate',
                    params: { url: step.url },
                    description: `Navigate to ${step.url}`,
                    validation: step.validate || []
                };
                
            case 'screenshot':
                const screenshotPath = `./screenshots/${sessionId}/${step.name || `step-${stepIndex}`}`;
                return {
                    tool: 'mcp__playwright__playwright_screenshot',
                    params: { 
                        name: step.name || `step-${stepIndex}`,
                        savePng: true,
                        storeBase64: false,
                        outputPath: screenshotPath
                    },
                    description: `Take screenshot: ${step.name || `step-${stepIndex}`} (saved to ${screenshotPath})`,
                    validation: []
                };
                
            case 'fill':
                // Handle multiple fields or single field
                if (step.fields) {
                    return Object.entries(step.fields).map(([selector, value]) => ({
                        tool: 'mcp__playwright__playwright_fill',
                        params: { selector, value },
                        description: `Fill ${selector} with "${value}"`,
                        validation: step.validate || []
                    }));
                } else if (step.selector && step.value) {
                    return {
                        tool: 'mcp__playwright__playwright_fill',
                        params: { selector: step.selector, value: step.value },
                        description: `Fill ${step.selector} with "${step.value}"`,
                        validation: step.validate || []
                    };
                }
                break;
                
            case 'click':
                return {
                    tool: 'mcp__playwright__playwright_click',
                    params: { selector: step.selector },
                    description: `Click ${step.selector}`,
                    validation: step.validate || []
                };
                
            case 'verify_state':
                return {
                    tool: 'mcp__playwright__playwright_get_visible_text',
                    params: {},
                    description: `Verify state: ${step.description || 'Check page state'}`,
                    validation: step.validate || []
                };
                
            case 'logout':
                // Handle logout as a sequence of steps
                if (step.steps && Array.isArray(step.steps)) {
                    return step.steps.map((subStep, subIndex) => 
                        this.stepToMCPCall(subStep, `${stepIndex}-${subIndex}`, sessionId)
                    ).flat();
                }
                break;
                
            default:
                return {
                    tool: 'mcp__playwright__playwright_get_visible_text',
                    params: {},
                    description: `Unknown action: ${step.action}`,
                    validation: []
                };
        }
    }

    /**
     * Generate execution plan from scenario
     */
    async generateExecutionPlan(scenario) {
        const sessionId = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        
        // Create session-specific directories
        const sessionScreenshotsDir = path.join(this.screenshotsDir, sessionId);
        const sessionReportsDir = path.join(this.reportsDir, sessionId);
        
        if (!fs.existsSync(sessionScreenshotsDir)) {
            fs.mkdirSync(sessionScreenshotsDir, { recursive: true });
        }
        if (!fs.existsSync(sessionReportsDir)) {
            fs.mkdirSync(sessionReportsDir, { recursive: true });
        }
        
        const executionPlan = {
            sessionId,
            scenario: scenario.name,
            description: scenario.description,
            startTime: new Date().toISOString(),
            sessionScreenshotsDir,
            sessionReportsDir,
            objectives: scenario.objectives || [],
            steps: []
        };

        scenario.steps.forEach((step, index) => {
            const mcpCalls = this.stepToMCPCall(step, index + 1, sessionId);
            
            if (Array.isArray(mcpCalls)) {
                // Multiple calls (e.g., fill multiple fields)
                mcpCalls.forEach((call, subIndex) => {
                    executionPlan.steps.push({
                        stepNumber: `${index + 1}.${subIndex + 1}`,
                        originalStep: step,
                        mcpCall: call
                    });
                });
            } else if (mcpCalls) {
                // Single call
                executionPlan.steps.push({
                    stepNumber: index + 1,
                    originalStep: step,
                    mcpCall: mcpCalls
                });
            }
        });

        return executionPlan;
    }

    /**
     * Output execution instructions for Claude Code
     */
    outputExecutionInstructions(executionPlan) {
        console.log('');
        console.log('🚀 UAT EXECUTION PLAN READY');
        console.log('═'.repeat(50));
        console.log(`📋 Scenario: ${executionPlan.scenario}`);
        console.log(`📝 Description: ${executionPlan.description}`);
        console.log(`🆔 Session: ${executionPlan.sessionId}`);
        console.log(`📊 Total Steps: ${executionPlan.steps.length}`);
        console.log('');
        console.log('⚡ EXECUTE THESE MCP TOOLS IN SEQUENCE:');
        console.log('');

        executionPlan.steps.forEach((step, index) => {
            const { stepNumber, mcpCall } = step;
            console.log(`🔸 Step ${stepNumber}: ${mcpCall.description}`);
            
            // Format parameters for easy copying
            const paramsStr = JSON.stringify(mcpCall.params, null, 0);
            console.log(`   Function: ${mcpCall.tool}(${paramsStr})`);
            
            if (mcpCall.validation && mcpCall.validation.length > 0) {
                console.log(`   Validation: ${mcpCall.validation.length} checks required`);
            }
            console.log('');
        });

        console.log('📋 EXECUTION RULES:');
        console.log('1. Execute each function call exactly as shown');
        console.log('2. Wait for completion before proceeding to next step');
        console.log('3. Verify each step succeeds before continuing');
        console.log('4. Take screenshots for visual verification');
        console.log('');
        console.log('🎯 Ready for MCP tool execution!');
        console.log('═'.repeat(50));
        console.log('');
        console.log(`📁 Session Files:`);
        console.log(`   Screenshots: ${executionPlan.sessionScreenshotsDir}`);
        console.log(`   Reports: ${executionPlan.sessionReportsDir}`);
        console.log('');

        return executionPlan;
    }

    /**
     * Generate initial report template
     */
    async generateInitialReport(executionPlan) {
        try {
            const testResults = {
                status: 'in_progress',
                completedSteps: 0,
                failedSteps: 0,
                startTime: executionPlan.startTime,
                endTime: null
            };

            const { jsonReport, markdownReport } = await this.reportGenerator.generateReport(executionPlan, testResults);
            
            console.log('📊 Initial report generated:');
            console.log(`   JSON: ${jsonReport}`);
            console.log(`   Markdown: ${markdownReport}`);
            console.log('');
            
        } catch (error) {
            console.warn('⚠️  Could not generate initial report:', error.message);
        }
    }

    /**
     * Run a UAT scenario
     */
    async runScenario(scenarioName) {
        try {
            console.log(`🎯 Loading UAT scenario: ${scenarioName}`);
            
            // Load scenario
            const scenario = await this.loadScenario(scenarioName);
            console.log(`✅ Loaded scenario: ${scenario.description}`);
            
            // Generate execution plan
            const executionPlan = await this.generateExecutionPlan(scenario);
            
            // Output instructions for Claude Code
            this.outputExecutionInstructions(executionPlan);
            
            // Generate initial report template
            await this.generateInitialReport(executionPlan);
            
            return executionPlan;
            
        } catch (error) {
            console.error('❌ UAT Execution Failed:', error.message);
            process.exit(1);
        }
    }

    /**
     * Show help information
     */
    showHelp() {
        console.log('UAT Runner - Simplified Direct MCP Execution');
        console.log('');
        console.log('Usage:');
        console.log('  node uat-runner.js <scenario-name>    Run a UAT scenario');
        console.log('  node uat-runner.js list               List available scenarios');
        console.log('  node uat-runner.js help               Show this help');
        console.log('');
        console.log('Examples:');
        console.log('  node uat-runner.js login-flow         Run login flow scenario');
        console.log('  node uat-runner.js vehicle-crud       Run vehicle CRUD scenario');
        console.log('  node uat-runner.js error-handling     Run error handling scenario');
        console.log('');
        console.log('Features:');
        console.log('  • Screenshots saved to: ./screenshots/<session-id>/');
        console.log('  • Reports generated in: ./reports/<session-id>/');
        console.log('  • Session-specific folder organization');
        console.log('  • JSON and Markdown report formats');
        console.log('');
        console.log('Integration:');
        console.log('  Use slash command: /uat <scenario-name>');
        console.log('');
    }
}

// Main execution
async function main() {
    const runner = new UATRunner();
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        runner.showHelp();
        return;
    }
    
    const command = args[0];
    
    switch (command) {
        case 'help':
        case '--help':
        case '-h':
            runner.showHelp();
            break;
            
        case 'list':
        case 'scenarios':
            await runner.listScenarios();
            break;
            
        default:
            // Treat as scenario name
            await runner.runScenario(command);
            break;
    }
}

// Run if called directly (ES module check)
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(error => {
        console.error('Fatal error:', error.message);
        process.exit(1);
    });
}

export { UATRunner };