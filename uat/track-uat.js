#!/usr/bin/env node

/**
 * Track UAT - Simple interface for tracking UAT execution progress
 */

import { AutoReportTracker } from './auto-report-tracker.js';

const tracker = new AutoReportTracker();

async function trackUAT() {
    // Auto-detect the latest session
    const session = tracker.loadLatestSession();
    
    if (!session) {
        console.log('❌ No active UAT session found.');
        console.log('');
        console.log('To start tracking:');
        console.log('1. Run: node uat-runner.js <scenario-name>');
        console.log('2. Then run: node track-uat.js');
        console.log('');
        return;
    }
    
    console.log(`🎯 Tracking UAT Session: ${session.sessionId}`);
    console.log('');
    console.log('Commands:');
    console.log('  [Enter] - Mark next step as completed');
    console.log('  [c] - Complete session and generate final report');
    console.log('  [s] - Show current status');
    console.log('  [q] - Quit tracking');
    console.log('');
    
    // Interactive loop
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    
    process.stdin.on('data', async (key) => {
        if (key === '\u0003' || key === 'q') { // Ctrl+C or 'q'
            console.log('\n👋 Stopped tracking');
            process.exit();
        }
        
        if (key === '\r' || key === '\n') { // Enter
            await tracker.markNextStepCompleted();
        }
        
        if (key === 'c') {
            console.log('\n🎯 Completing session...');
            await tracker.completeSession();
            console.log('✅ Session completed! Press [q] to quit.');
        }
        
        if (key === 's') {
            const status = tracker.getSessionStatus();
            console.log('\n📊 Current Status:', status);
        }
    });
}

trackUAT();