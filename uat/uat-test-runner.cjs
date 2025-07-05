#!/usr/bin/env node

/**
 * UAT Test Runner - Main Entry Point
 * 
 * This is the main command-line interface for the VRP System UAT testing framework.
 * It provides a unified interface to all UAT commands and testing capabilities.
 */

const fs = require('fs');
const path = require('path');

const COMMANDS = {
  'init': {
    description: 'Initialize UAT testing environment',
    file: './commands/uat-init.cjs',
    usage: 'uat init [--debug]',
    examples: [
      'uat init',
      'uat init --debug'
    ]
  },
  'login': {
    description: 'Test login functionality',
    file: './commands/uat-login.cjs',
    usage: 'uat login [email] [password] [--debug]',
    examples: [
      'uat login',
      'uat login test1@example.com testpassword123246',
      'uat login user@test.com password123 --debug'
    ]
  },
  'crud': {
    description: 'Test CRUD operations on entities',
    file: './commands/uat-crud.cjs',
    usage: 'uat crud [entity] [action] [--debug]',
    examples: [
      'uat crud project create',
      'uat crud vehicle delete',
      'uat crud job read --debug'
    ]
  },
  'scenario': {
    description: 'Execute predefined test scenarios',
    file: './commands/uat-scenario.cjs',
    usage: 'uat scenario [scenario-name] [--debug] [--dry-run] [--validate]',
    examples: [
      'uat scenario login-flow',
      'uat scenario vehicle-crud --debug',
      'uat scenario error-handling --dry-run',
      'uat scenario login-flow --validate'
    ]
  },
  'report': {
    description: 'Generate comprehensive test reports',
    file: './commands/uat-report.cjs',
    usage: 'uat report [session-id]',
    examples: [
      'uat report',
      'uat report 20241205-143022'
    ]
  }
};

function showHelp(command = null) {
  if (command && COMMANDS[command]) {
    const cmd = COMMANDS[command];
    console.log(`UAT Test Runner - ${cmd.description}`);
    console.log('');
    console.log('Usage:');
    console.log(`  ${cmd.usage}`);
    console.log('');
    console.log('Examples:');
    cmd.examples.forEach(example => {
      console.log(`  ${example}`);
    });
    return;
  }

  console.log('VRP System UAT Test Runner');
  console.log('');
  console.log('Usage: uat [command] [options]');
  console.log('');
  console.log('Commands:');
  
  Object.entries(COMMANDS).forEach(([name, cmd]) => {
    console.log(`  ${name.padEnd(12)} ${cmd.description}`);
  });
  
  console.log('');
  console.log('Global Options:');
  console.log('  --debug      Enable debug mode with verbose logging');
  console.log('  --help       Show help information');
  console.log('');
  console.log('Examples:');
  console.log('  uat init                          # Initialize UAT environment');
  console.log('  uat login                         # Test login with default credentials');
  console.log('  uat crud vehicle create           # Test vehicle creation');
  console.log('  uat scenario login-flow           # Run login flow scenario');
  console.log('  uat report                        # Generate test report');
  console.log('');
  console.log('For detailed help on a specific command:');
  console.log('  uat [command] --help');
  console.log('');
  console.log('Documentation:');
  console.log('  UAT Workflow: ./uat/UAT-COMPLETE-WORKFLOW.md');
  console.log('  Commands: ./uat/UAT-COMMANDS.md');
  console.log('  Health Checks: ./uat/HEALTH-CHECK-SETUP.md');
}

function listScenarios() {
  console.log('Available Test Scenarios:');
  console.log('');
  
  const scenariosDir = path.join(__dirname, 'scenarios');
  
  try {
    const files = fs.readdirSync(scenariosDir)
      .filter(file => file.endsWith('.js'))
      .map(file => file.replace('.js', ''));
    
    files.forEach(file => {
      try {
        const scenarioPath = path.join(scenariosDir, `${file}.js`);
        const scenario = require(scenarioPath);
        
        console.log(`  ${file.padEnd(20)} ${scenario.description || 'No description'}`);
      } catch (error) {
        console.log(`  ${file.padEnd(20)} (Error loading scenario)`);
      }
    });
    
    if (files.length === 0) {
      console.log('  No scenarios found in scenarios directory');
    }
    
  } catch (error) {
    console.log('  Could not list scenarios:', error.message);
  }
  
  console.log('');
}

function validateEnvironment() {
  const checks = [
    {
      name: 'Node.js version',
      check: () => {
        const version = process.version;
        const major = parseInt(version.slice(1).split('.')[0]);
        return major >= 16;
      },
      message: 'Node.js 16+ required'
    },
    {
      name: 'UAT directories',
      check: () => {
        const dirs = [
          path.join(__dirname, 'scenarios'),
          path.join(__dirname, 'commands'),
          path.join(__dirname, 'engine'),
          path.join(__dirname, 'screenshots'),
          path.join(__dirname, 'reports'),
          path.join(__dirname, 'videos')
        ];
        
        return dirs.every(dir => fs.existsSync(dir));
      },
      message: 'Required UAT directories missing'
    },
    {
      name: 'Scenario files',
      check: () => {
        const scenariosDir = path.join(__dirname, 'scenarios');
        if (!fs.existsSync(scenariosDir)) return false;
        
        const scenarios = fs.readdirSync(scenariosDir)
          .filter(file => file.endsWith('.js'));
        
        return scenarios.length > 0;
      },
      message: 'No test scenarios found'
    },
    {
      name: 'Helper scripts',
      check: () => {
        const scripts = [
          path.join(__dirname, 'uat-helper.sh'),
          path.join(__dirname, 'uat-recorder.ps1')
        ];
        
        return scripts.every(script => fs.existsSync(script));
      },
      message: 'Helper scripts missing'
    }
  ];
  
  console.log('Environment Validation:');
  console.log('');
  
  let allPassed = true;
  
  checks.forEach(check => {
    const passed = check.check();
    const status = passed ? '✅' : '❌';
    console.log(`  ${status} ${check.name}`);
    
    if (!passed) {
      console.log(`      ${check.message}`);
      allPassed = false;
    }
  });
  
  console.log('');
  
  if (allPassed) {
    console.log('✅ Environment validation passed');
  } else {
    console.log('❌ Environment validation failed');
    console.log('Please fix the issues above before running UAT tests');
  }
  
  return allPassed;
}

async function runCommand(commandName, args) {
  if (!COMMANDS[commandName]) {
    console.error(`❌ Unknown command: ${commandName}`);
    console.log('');
    showHelp();
    process.exit(1);
  }
  
  const command = COMMANDS[commandName];
  const commandPath = path.join(__dirname, command.file);
  
  if (!fs.existsSync(commandPath)) {
    console.error(`❌ Command file not found: ${commandPath}`);
    process.exit(1);
  }
  
  try {
    // Load and execute the command
    const commandModule = require(commandPath);
    
    // Pass arguments to the command
    let result;
    
    switch (commandName) {
      case 'init':
        result = await commandModule();
        break;
      case 'login':
        result = await commandModule(args[0], args[1]);
        break;
      case 'crud':
        result = await commandModule(args[0], args[1]);
        break;
      case 'scenario':
        if (commandModule.uatScenario) {
          result = await commandModule.uatScenario(args[0]);
        } else {
          result = await commandModule(args[0]);
        }
        break;
      case 'report':
        result = await commandModule({ sessionId: args[0] });
        break;
      default:
        throw new Error(`Command execution not implemented: ${commandName}`);
    }
    
    // Log result if in debug mode
    if (process.argv.includes('--debug') && result) {
      console.log('\n🔍 Debug - Command Result:');
      console.log(JSON.stringify(result, null, 2));
    }
    
    return result;
    
  } catch (error) {
    console.error(`❌ Command execution failed: ${error.message}`);
    
    if (process.argv.includes('--debug')) {
      console.error('\n🔍 Debug - Stack Trace:');
      console.error(error.stack);
    }
    
    process.exit(1);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  // Handle no arguments
  if (args.length === 0) {
    showHelp();
    return;
  }
  
  const command = args[0];
  const commandArgs = args.slice(1).filter(arg => !arg.startsWith('--'));
  
  // Handle help flags
  if (args.includes('--help') || args.includes('-h')) {
    showHelp(command);
    return;
  }
  
  // Handle special commands
  switch (command) {
    case 'help':
      showHelp(commandArgs[0]);
      return;
      
    case 'scenarios':
    case 'list-scenarios':
      listScenarios();
      return;
      
    case 'validate':
    case 'check':
      const isValid = validateEnvironment();
      process.exit(isValid ? 0 : 1);
      return;
      
    case 'version':
      console.log('VRP System UAT Test Runner v1.0.0');
      return;
  }
  
  // Validate environment before running commands
  if (!['help', 'version', 'scenarios'].includes(command)) {
    console.log('🔍 Validating environment...');
    const isValid = validateEnvironment();
    
    if (!isValid) {
      console.log('Please fix environment issues before proceeding');
      process.exit(1);
    }
    
    console.log('');
  }
  
  // Execute the command
  await runCommand(command, commandArgs);
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error.message);
    process.exit(1);
  });
}

module.exports = {
  runCommand,
  showHelp,
  listScenarios,
  validateEnvironment
};