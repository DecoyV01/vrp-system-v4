#!/usr/bin/env node

/**
 * UAT Report Command
 * 
 * Generates comprehensive test reports including:
 * 1. Test execution summary
 * 2. Screenshot compilation
 * 3. Video generation from screenshots
 * 4. Performance metrics
 * 5. Error analysis
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const UATTestSession = require('../engine/test-session.cjs');

async function uatReport(options = {}) {
  console.log('📊 Generating UAT test report...');
  
  const reportDir = '/mnt/c/projects/vrp-system/v4/uat/reports';
  const screenshotsDir = '/mnt/c/projects/vrp-system/v4/uat/screenshots';
  const videosDir = '/mnt/c/projects/vrp-system/v4/uat/videos';
  
  // Use provided sessionId or get current active session
  let sessionId = options.sessionId;
  let testSession;
  
  if (sessionId) {
    testSession = new UATTestSession(sessionId);
  } else {
    testSession = UATTestSession.getActiveSession();
    sessionId = testSession.sessionId;
  }
  
  const reportFile = path.join(reportDir, `report-${sessionId}.md`);
  const jsonReportFile = path.join(reportDir, `report-${sessionId}.json`);
  
  try {
    // Ensure directories exist
    ensureDirectoryExists(reportDir);
    ensureDirectoryExists(videosDir);
    
    // Collect data for report from session
    const reportData = await collectReportDataFromSession(testSession, screenshotsDir);
    
    // Generate video from screenshots
    if (reportData.screenshots.length > 0) {
      console.log('🎬 Creating video from screenshots...');
      const videoFile = await createVideoFromScreenshots(reportData.screenshots, videosDir, sessionId);
      reportData.videoFile = videoFile;
    }
    
    // Generate reports
    const markdownReport = generateMarkdownReport(reportData, sessionId);
    const jsonReport = generateJsonReport(reportData, sessionId);
    
    // Save reports
    fs.writeFileSync(reportFile, markdownReport);
    fs.writeFileSync(jsonReportFile, JSON.stringify(jsonReport, null, 2));
    
    console.log('✅ Report generation completed!');
    console.log(`📄 Markdown report: ${reportFile}`);
    console.log(`🔢 JSON report: ${jsonReportFile}`);
    
    if (reportData.videoFile) {
      console.log(`🎥 Video: ${reportData.videoFile}`);
    }
    
    // Display summary
    displayReportSummary(reportData);
    
    return {
      success: true,
      sessionId,
      files: {
        markdown: reportFile,
        json: jsonReportFile,
        video: reportData.videoFile
      },
      summary: reportData.summary
    };
    
  } catch (error) {
    console.error(`❌ Report generation failed: ${error.message}`);
    
    return {
      success: false,
      error: error.message
    };
  }
}

async function collectReportDataFromSession(testSession, screenshotsDir) {
  console.log('📋 Collecting test data from session...');
  
  const sessionData = testSession.getSessionData();
  const tests = testSession.getTests();
  const sessionScreenshots = testSession.getScreenshots();
  
  const data = {
    sessionId: sessionData.sessionId,
    timestamp: new Date().toISOString(),
    startTime: sessionData.startTime,
    endTime: sessionData.endTime,
    tests: tests,
    screenshots: [],
    summary: sessionData.summary
  };
  
  // Include objectives data if available in session
  const objectives = testSession.getObjectives();
  if (objectives) {
    data.objectives = objectives;
  }
  
  // Collect screenshots from session and file system
  const screenshotMap = new Map();
  
  // Add session screenshots
  sessionScreenshots.forEach(screenshot => {
    screenshotMap.set(screenshot.filename || screenshot.name, screenshot);
  });
  
  // Add file system screenshots for this session
  if (fs.existsSync(screenshotsDir)) {
    const files = fs.readdirSync(screenshotsDir)
      .filter(file => file.endsWith('.png') && file.includes(sessionData.sessionId))
      .sort();
    
    files.forEach(file => {
      const filePath = path.join(screenshotsDir, file);
      const stats = fs.statSync(filePath);
      
      const screenshot = {
        filename: file,
        path: filePath,
        timestamp: stats.mtime.toISOString(),
        size: stats.size,
        name: extractScreenshotName(file)
      };
      
      screenshotMap.set(file, screenshot);
    });
  }
  
  data.screenshots = Array.from(screenshotMap.values());
  data.summary.totalScreenshots = data.screenshots.length;
  
  // Analyze tests and screenshots for insights
  data.insights = analyzeTestsAndScreenshots(tests, data.screenshots);
  
  return data;
}

async function collectReportData(screenshotsDir, sessionId) {
  console.log('📋 Collecting test data...');
  
  const data = {
    sessionId,
    timestamp: new Date().toISOString(),
    screenshots: [],
    summary: {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      totalScreenshots: 0,
      duration: 0
    }
  };
  
  // Collect screenshots
  if (fs.existsSync(screenshotsDir)) {
    const files = fs.readdirSync(screenshotsDir)
      .filter(file => file.endsWith('.png') && file.includes(sessionId))
      .sort();
    
    data.screenshots = files.map(file => {
      const filePath = path.join(screenshotsDir, file);
      const stats = fs.statSync(filePath);
      
      return {
        filename: file,
        path: filePath,
        timestamp: stats.mtime.toISOString(),
        size: stats.size,
        name: extractScreenshotName(file)
      };
    });
    
    data.summary.totalScreenshots = data.screenshots.length;
  }
  
  // Try to find test result files
  const reportsDir = '/mnt/c/projects/vrp-system/v4/uat/reports';
  if (fs.existsSync(reportsDir)) {
    const resultFiles = fs.readdirSync(reportsDir)
      .filter(file => file.endsWith('.json') && file.includes(sessionId));
    
    for (const file of resultFiles) {
      try {
        const content = fs.readFileSync(path.join(reportsDir, file), 'utf8');
        const result = JSON.parse(content);
        
        if (result.results) {
          data.summary.totalTests += result.results.length;
          data.summary.passedTests += result.results.filter(r => r.status === 'passed').length;
          data.summary.failedTests += result.results.filter(r => r.status === 'failed').length;
          data.summary.duration += result.summary?.duration || 0;
        }
      } catch (error) {
        console.warn(`⚠️ Could not parse result file ${file}: ${error.message}`);
      }
    }
  }
  
  // Analyze screenshots for insights
  data.insights = analyzeScreenshots(data.screenshots);
  
  return data;
}

function analyzeTestsAndScreenshots(tests, screenshots) {
  const insights = {
    testPhases: [],
    errorScreenshots: [],
    successScreenshots: [],
    pageTransitions: [],
    testsByType: {},
    testsByEntity: {},
    failurePatterns: []
  };
  
  // Analyze tests
  tests.forEach(test => {
    // Group by type
    if (!insights.testsByType[test.type]) {
      insights.testsByType[test.type] = { passed: 0, failed: 0, total: 0 };
    }
    insights.testsByType[test.type].total++;
    if (test.status === 'passed') {
      insights.testsByType[test.type].passed++;
    } else {
      insights.testsByType[test.type].failed++;
    }
    
    // Group by entity
    if (test.entity) {
      if (!insights.testsByEntity[test.entity]) {
        insights.testsByEntity[test.entity] = { passed: 0, failed: 0, total: 0 };
      }
      insights.testsByEntity[test.entity].total++;
      if (test.status === 'passed') {
        insights.testsByEntity[test.entity].passed++;
      } else {
        insights.testsByEntity[test.entity].failed++;
        insights.failurePatterns.push({
          entity: test.entity,
          action: test.action,
          error: test.error
        });
      }
    }
  });
  
  // Analyze screenshots
  screenshots.forEach(screenshot => {
    const name = screenshot.name.toLowerCase();
    
    if (name.includes('failure') || name.includes('error')) {
      insights.errorScreenshots.push(screenshot);
    } else if (name.includes('success') || name.includes('completed')) {
      insights.successScreenshots.push(screenshot);
    }
    
    if (name.includes('baseline')) {
      insights.testPhases.push({ phase: 'initialization', screenshot });
    } else if (name.includes('login')) {
      insights.testPhases.push({ phase: 'authentication', screenshot });
    } else if (name.includes('navigate')) {
      insights.pageTransitions.push(screenshot);
    }
  });
  
  return insights;
}

function analyzeScreenshots(screenshots) {
  const insights = {
    testPhases: [],
    errorScreenshots: [],
    successScreenshots: [],
    pageTransitions: []
  };
  
  screenshots.forEach(screenshot => {
    const name = screenshot.name.toLowerCase();
    
    if (name.includes('failure') || name.includes('error')) {
      insights.errorScreenshots.push(screenshot);
    } else if (name.includes('success') || name.includes('completed')) {
      insights.successScreenshots.push(screenshot);
    }
    
    if (name.includes('baseline')) {
      insights.testPhases.push({ phase: 'initialization', screenshot });
    } else if (name.includes('login')) {
      insights.testPhases.push({ phase: 'authentication', screenshot });
    } else if (name.includes('navigate')) {
      insights.pageTransitions.push(screenshot);
    }
  });
  
  return insights;
}

async function createVideoFromScreenshots(screenshots, videosDir, sessionId) {
  if (screenshots.length < 2) {
    console.log('⚠️ Not enough screenshots to create video');
    return null;
  }
  
  const videoFile = path.join(videosDir, `uat-session-${sessionId}.mp4`);
  const tempDir = path.join(videosDir, `temp-${sessionId}`);
  
  try {
    // Create temp directory and copy/rename screenshots for ffmpeg
    ensureDirectoryExists(tempDir);
    
    screenshots.forEach((screenshot, index) => {
      const paddedIndex = String(index).padStart(4, '0');
      const tempFile = path.join(tempDir, `frame-${paddedIndex}.png`);
      fs.copyFileSync(screenshot.path, tempFile);
    });
    
    // Create video using ffmpeg
    await runCommand('ffmpeg', [
      '-framerate', '0.5', // Half second per frame
      '-i', path.join(tempDir, 'frame-%04d.png'),
      '-c:v', 'libx264',
      '-pix_fmt', 'yuv420p',
      '-y', // Overwrite output file
      videoFile
    ]);
    
    // Cleanup temp directory
    fs.rmSync(tempDir, { recursive: true, force: true });
    
    console.log(`✅ Video created: ${videoFile}`);
    return videoFile;
    
  } catch (error) {
    console.warn(`⚠️ Video creation failed: ${error.message}`);
    
    // Cleanup on failure
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    
    return null;
  }
}

function generateMarkdownReport(data, sessionId) {
  const { summary, screenshots, insights, tests, startTime, endTime, objectives } = data;
  
  // Check if this is an objective-enhanced report
  const hasObjectives = objectives && objectives.summary && objectives.definitions;
  
  return `# UAT Test Report - ${sessionId}

## 📊 Executive Summary

- **Session ID**: ${sessionId}
- **Generated**: ${new Date().toLocaleString()}
- **Start Time**: ${startTime ? new Date(startTime).toLocaleString() : 'Unknown'}
- **End Time**: ${endTime ? new Date(endTime).toLocaleString() : 'Active'}
- **Duration**: ${Math.round(summary.duration / 1000)}s
- **Overall Status**: ${hasObjectives && objectives.summary.successRate === 100 ? '✅ PASSED' : 
                      hasObjectives && objectives.summary.failed > 0 ? '❌ FAILED' :
                      summary.totalTests > 0 && summary.failedTests === 0 ? '✅ PASSED' : '❌ FAILED'}

${hasObjectives ? `## 🎯 Objectives Dashboard

| Objective | Status | Progress | Priority | Category |
|-----------|--------|----------|----------|----------|
${objectives.details.map(obj => {
  const emoji = obj.status === 'completed' ? '✅' : 
                obj.status === 'failed' ? '❌' : 
                obj.status === 'in_progress' ? '🔄' : 
                obj.status === 'blocked' ? '🚫' : '⏳';
  return `| ${obj.title} | ${emoji} ${obj.status.toUpperCase()} | ${obj.progress}% | ${objectives.definitions.find(d => d.id === obj.id)?.priority || 'Unknown'} | ${objectives.definitions.find(d => d.id === obj.id)?.category || 'Unknown'} |`;
}).join('\n')}

### Objective Summary
- **Total Objectives**: ${objectives.summary.total}
- **Completed**: ${objectives.summary.completed} ✅
- **Failed**: ${objectives.summary.failed} ❌
- **In Progress**: ${objectives.summary.in_progress} 🔄
- **Pending**: ${objectives.summary.pending} ⏳
- **Success Rate**: ${objectives.summary.successRate}%
` : ''}

## 📋 Test Execution Summary

- **Total Tests**: ${summary.totalTests}
- **Passed**: ${summary.passedTests} ✅
- **Failed**: ${summary.failedTests} ❌
- **Success Rate**: ${summary.totalTests > 0 ? ((summary.passedTests / summary.totalTests) * 100).toFixed(1) : 0}%
- **Screenshots**: ${summary.totalScreenshots}

## Test Results

${tests && tests.length > 0 ? `### Test Summary
${tests.slice(0, 5).map((test, index) => `
**${index + 1}. ${test.name}** ${test.status === 'passed' ? '✅' : '❌'} | ${test.entity || 'N/A'} ${test.action || 'test'} | ${test.duration ? Math.round(test.duration / 1000) : 0}s${test.error ? ` | Error: ${test.error}` : ''}
`).join('')}
${tests.length > 5 ? `\n**Note**: Showing 5 of ${tests.length} tests. See full session data for complete test details.` : ''}
` : ''}

${insights.testsByEntity && Object.keys(insights.testsByEntity).length > 0 ? `### Test Results by Entity

${Object.entries(insights.testsByEntity).map(([entity, stats]) => `
- **${entity}**: ${stats.passed}/${stats.total} passed (${((stats.passed / stats.total) * 100).toFixed(1)}%)
`).join('')}
` : ''}

${summary.failedTests > 0 && insights.failurePatterns ? `### ❌ Failure Analysis
${insights.failurePatterns.map(pattern => `- **${pattern.entity} ${pattern.action}**: ${pattern.error}`).join('\n')}
` : ''}

${hasObjectives ? `
## 🔍 Detailed Objectives Results

${objectives.definitions.map(objective => {
  const status = objectives.details.find(d => d.id === objective.id);
  const emoji = status?.status === 'completed' ? '✅' : 
                status?.status === 'failed' ? '❌' : 
                status?.status === 'in_progress' ? '🔄' : 
                status?.status === 'blocked' ? '🚫' : '⏳';
  
  return `### ${emoji} ${objective.title}

**Category**: ${objective.category} | **Priority**: ${objective.priority}  
**Status**: ${status?.status?.toUpperCase() || 'UNKNOWN'} | **Progress**: ${status?.progress || 0}%

**Description**: ${objective.description}

**Acceptance Criteria:**
${objective.acceptance_criteria.map((criteria, index) => `${index + 1}. ${criteria}`).join('\n')}

**Test Coverage:**
- **Steps**: ${objective.steps.join(', ')}
- **Dependencies**: ${objective.dependencies && objective.dependencies.length > 0 ? objective.dependencies.join(', ') : 'None'}

${status?.status === 'failed' ? `
**❌ Failure Details:**
- **Failed at**: ${status.endTime ? new Date(status.endTime).toLocaleString() : 'Unknown'}
- **Completed steps**: ${status.completedSteps?.length || 0}/${status.totalSteps || 0}
` : ''}

${status?.status === 'completed' ? `
**✅ Success Details:**
- **Completed at**: ${status.endTime ? new Date(status.endTime).toLocaleString() : 'Unknown'}
- **Duration**: ${status.startTime && status.endTime ? Math.round((new Date(status.endTime) - new Date(status.startTime)) / 1000) : 0}s
- **All criteria met**: ✅
` : ''}

---
`;
}).join('\n')}

` : ''}

## Visual Documentation

### Screenshots Timeline
${screenshots.length > 0 ? `
${screenshots.slice(0, 10).map((screenshot, index) => `
#### ${index + 1}. ${screenshot.name}
- **File**: ${screenshot.filename}
- **Timestamp**: ${new Date(screenshot.timestamp).toLocaleString()}
- **Size**: ${screenshot.size && !isNaN(screenshot.size) ? (screenshot.size / 1024).toFixed(1) + ' KB' : 'Unknown'}

![${screenshot.name}](${screenshot.filename})
`).join('')}
${screenshots.length > 10 ? `\n**Note**: Showing 10 of ${screenshots.length} screenshots. See full session data for complete visual documentation.` : ''}
` : '- No screenshots captured during this session'}

${data.videoFile ? `
### Test Execution Video

A video compilation of the test session is available:
- **File**: ${path.basename(data.videoFile)}
- **Duration**: ~${Math.round(screenshots.length * 0.5)}s

` : ''}

## Test Insights

### Test Phase Coverage
${insights.testPhases.map(phase => `- **${phase.phase}**: ${phase.screenshot.name}`).join('\n')}

### Page Transitions
${insights.pageTransitions.length > 0 ? 
  insights.pageTransitions.map(t => `- ${t.name}`).join('\n') : 
  '- No page transitions detected'
}

## 💼 Recommendations

${hasObjectives && objectives.summary.failed > 0 ? `
### 🔧 Failed Objectives to Address
${objectives.details.filter(obj => obj.status === 'failed').map(obj => {
  const definition = objectives.definitions.find(d => d.id === obj.id);
  return `
#### ${obj.title} (${definition?.priority} Priority)
- **Impact**: ${definition?.priority === 'Critical' ? 'System unusable' : 
                        definition?.priority === 'High' ? 'Major functionality affected' :
                        definition?.priority === 'Medium' ? 'User experience degraded' : 'Minor issues'}
- **Category**: ${definition?.category}
- **Completed Steps**: ${obj.completedSteps?.length || 0}/${obj.totalSteps || 0}
- **Next Actions**: 
  - Review failure screenshots for visual clues
  - Validate acceptance criteria: ${definition?.acceptance_criteria?.join(', ') || 'None defined'}
  - Check related test steps: ${definition?.steps?.join(', ') || 'None defined'}
`;
}).join('')}
` : ''}

${hasObjectives && objectives.summary.successRate === 100 ? `
### 🎉 All Objectives Achieved!
- **Value Delivered**: All defined objectives have been successfully validated
- **System Quality**: ${objectives.summary.completed} critical functions are working correctly
- **Next Steps**: 
  - Consider expanding test coverage with additional edge cases
  - Review and update acceptance criteria based on evolved requirements
  - Add new objectives for upcoming features
` : ''}

${!hasObjectives && summary.failedTests > 0 ? `
### 🔧 Issues to Address
- Review failed test screenshots for visual clues
- Check application logs for error details
- Verify test environment setup
- Update test scenarios if UI has changed
` : ''}

${!hasObjectives && summary.passedTests === summary.totalTests && summary.totalTests > 0 ? `
### 🎉 All Tests Passed!
- Consider adding more edge case scenarios
- Review test coverage for completeness
- Update test data periodically
` : ''}

${hasObjectives ? `
### 📈 Objective-Based Insights
- **Critical Objectives**: ${objectives.definitions.filter(o => o.priority === 'Critical').length} (${Math.round((objectives.details.filter(d => d.status === 'completed' && objectives.definitions.find(def => def.id === d.id)?.priority === 'Critical').length / Math.max(objectives.definitions.filter(o => o.priority === 'Critical').length, 1)) * 100)}% success rate)
- **High Priority Objectives**: ${objectives.definitions.filter(o => o.priority === 'High').length} (${Math.round((objectives.details.filter(d => d.status === 'completed' && objectives.definitions.find(def => def.id === d.id)?.priority === 'High').length / Math.max(objectives.definitions.filter(o => o.priority === 'High').length, 1)) * 100)}% success rate)
- **Categories Covered**: ${[...new Set(objectives.definitions.map(o => o.category))].join(', ')}
- **Dependency Chain**: ${objectives.definitions.some(o => o.dependencies && o.dependencies.length > 0) ? 'Complex dependency relationships detected' : 'Independent objectives tested'}
` : ''}

## Files Generated
- Report: report-${sessionId}.md
- JSON Data: report-${sessionId}.json
${data.videoFile ? `- Video: ${path.basename(data.videoFile)}` : ''}

---
*Generated by VRP System UAT Framework*
`;
}

function generateJsonReport(data, sessionId) {
  const report = {
    sessionId,
    generatedAt: new Date().toISOString(),
    summary: data.summary,
    screenshots: data.screenshots,
    insights: data.insights,
    videoFile: data.videoFile,
    metadata: {
      framework: 'VRP System UAT',
      version: '1.0.0',
      environment: 'development'
    }
  };
  
  // Include objectives data if available
  if (data.objectives) {
    report.objectives = data.objectives;
  }
  
  // Include tests data if available
  if (data.tests) {
    report.tests = data.tests;
  }
  
  return report;
}

function displayReportSummary(data) {
  const { summary, objectives } = data;
  
  console.log('');
  console.log('📊 Test Session Summary');
  console.log('='.repeat(30));
  
  // Show objectives summary if available
  if (objectives && objectives.summary) {
    console.log('🎯 Objectives Achievement:');
    console.log(`  Total: ${objectives.summary.total}`);
    console.log(`  Completed: ${objectives.summary.completed} ✅`);
    console.log(`  Failed: ${objectives.summary.failed} ❌`);
    console.log(`  Success Rate: ${objectives.summary.successRate}%`);
    console.log('');
  }
  
  console.log('⚙️ Test Execution:');
  console.log(`  Tests Run: ${summary.totalTests}`);
  console.log(`  Passed: ${summary.passedTests} ✅`);
  console.log(`  Failed: ${summary.failedTests} ❌`);
  console.log(`  Success Rate: ${summary.totalTests > 0 ? ((summary.passedTests / summary.totalTests) * 100).toFixed(1) : 0}%`);
  console.log(`  Screenshots: ${summary.totalScreenshots}`);
  console.log(`  Duration: ${Math.round(summary.duration / 1000)}s`);
  console.log('');
}

// Helper functions
function generateSessionId() {
  const date = new Date();
  return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}-${String(date.getHours()).padStart(2, '0')}${String(date.getMinutes()).padStart(2, '0')}${String(date.getSeconds()).padStart(2, '0')}`;
}

function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function extractScreenshotName(filename) {
  // Extract meaningful name from filename
  const parts = filename.replace('.png', '').split('-');
  if (parts.length > 1) {
    return parts.slice(1).join(' ').replace(/_/g, ' ');
  }
  return filename.replace('.png', '');
}

async function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const process = spawn(command, args, { stdio: 'pipe' });
    
    let stdout = '';
    let stderr = '';
    
    process.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    process.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    process.on('close', (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(`Command failed with code ${code}: ${stderr}`));
      }
    });
    
    process.on('error', (error) => {
      reject(error);
    });
  });
}

// Run if called directly
if (require.main === module) {
  const sessionId = process.argv[2];
  
  uatReport({ sessionId })
    .then(result => {
      if (result.success) {
        console.log('\n✅ Report generation completed successfully!');
        
        // Try to open the report in default browser
        if (process.platform === 'win32') {
          const reportPath = result.files.markdown.replace(/\//g, '\\');
          spawn('cmd', ['/c', 'start', reportPath], { detached: true, stdio: 'ignore' });
        }
      }
      
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal error:', error.message);
      process.exit(1);
    });
}

module.exports = uatReport;