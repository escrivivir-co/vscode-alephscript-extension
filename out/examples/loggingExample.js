"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExampleService = void 0;
exports.demonstrateLoggingFeatures = demonstrateLoggingFeatures;
exports.registerExampleCommands = registerExampleCommands;
const vscode = __importStar(require("vscode"));
const loggingManager_1 = require("../loggingManager");
/**
 * Example service demonstrating the logging system usage
 */
class ExampleService {
    constructor() {
        this.logger = (0, loggingManager_1.createLogger)(loggingManager_1.LogCategory.GENERAL, 'ExampleService');
    }
    start() {
        this.logger.info('ExampleService starting up');
        // Example: Info level logging
        this.logger.info('Service configuration loaded', {
            config: { debug: true, timeout: 5000 }
        });
        // Example: Debug logging with data
        this.logger.debug('Internal state initialized', {
            state: 'ready',
            timestamp: Date.now()
        });
        // Start a periodic task to generate different log levels
        this.startPeriodicLogging();
        this.logger.info('ExampleService started successfully');
    }
    startPeriodicLogging() {
        this.intervalId = setInterval(() => {
            // Generate different types of logs
            const rand = Math.random();
            if (rand < 0.1) {
                // 10% chance - Error
                this.logger.error('Simulated error occurred', {
                    errorCode: 'SIM_001',
                    details: 'This is a simulated error for demonstration'
                });
            }
            else if (rand < 0.2) {
                // 10% chance - Warning
                this.logger.warn('Performance warning detected', {
                    metric: 'responseTime',
                    value: 1500,
                    threshold: 1000
                });
            }
            else if (rand < 0.6) {
                // 40% chance - Info
                const operations = ['processData', 'updateCache', 'validateInput', 'sendNotification'];
                const operation = operations[Math.floor(Math.random() * operations.length)];
                this.logger.info(`Operation completed: ${operation}`, {
                    operation,
                    duration: Math.floor(Math.random() * 100) + 'ms'
                });
            }
            else if (rand < 0.9) {
                // 30% chance - Debug
                this.logger.debug('Debug information', {
                    memoryUsage: process.memoryUsage(),
                    activeConnections: Math.floor(Math.random() * 50)
                });
            }
            else {
                // 10% chance - Trace
                this.logger.trace('Detailed trace information', {
                    callStack: ['method1', 'method2', 'method3'],
                    variables: { x: 42, y: 'test' }
                });
            }
        }, 2000); // Log something every 2 seconds
    }
    simulateProcessingTask() {
        this.logger.info('Starting processing task');
        // Simulate async work
        setTimeout(() => {
            this.logger.debug('Phase 1 completed', { phase: 1, progress: 33 });
        }, 500);
        setTimeout(() => {
            this.logger.debug('Phase 2 completed', { phase: 2, progress: 66 });
        }, 1000);
        setTimeout(() => {
            const success = Math.random() > 0.3; // 70% success rate
            if (success) {
                this.logger.info('Processing task completed successfully', {
                    result: 'success',
                    itemsProcessed: Math.floor(Math.random() * 100) + 1
                });
            }
            else {
                this.logger.error('Processing task failed', {
                    result: 'failure',
                    reason: 'Network timeout'
                });
            }
        }, 1500);
    }
    testAllLogLevels() {
        this.logger.trace('This is a TRACE message - most detailed', { level: 'trace' });
        this.logger.debug('This is a DEBUG message - diagnostic info', { level: 'debug' });
        this.logger.info('This is an INFO message - general information', { level: 'info' });
        this.logger.warn('This is a WARN message - potential issue', { level: 'warn' });
        this.logger.error('This is an ERROR message - something went wrong', { level: 'error' });
    }
    testWithDifferentCategories() {
        const processLogger = (0, loggingManager_1.createLogger)(loggingManager_1.LogCategory.PROCESS, 'ExampleProcess');
        const socketLogger = (0, loggingManager_1.createLogger)(loggingManager_1.LogCategory.SOCKET, 'ExampleSocket');
        const configLogger = (0, loggingManager_1.createLogger)(loggingManager_1.LogCategory.CONFIG, 'ExampleConfig');
        processLogger.info('Process started with PID 12345');
        socketLogger.info('Socket connection established', { host: 'localhost', port: 3000 });
        configLogger.info('Configuration reloaded', { configFile: 'app.json' });
    }
    demonstrateErrorHandling() {
        try {
            // Simulate an error
            throw new Error('Simulated error for demonstration');
        }
        catch (error) {
            this.logger.error('Caught exception in demonstrateErrorHandling', {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
                method: 'demonstrateErrorHandling'
            });
        }
    }
    stop() {
        this.logger.info('ExampleService stopping');
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = undefined;
        }
        this.logger.info('ExampleService stopped successfully');
    }
}
exports.ExampleService = ExampleService;
// Function to demonstrate logging management
function demonstrateLoggingFeatures() {
    const loggingManager = loggingManager_1.LoggingManager.getInstance();
    // Show statistics
    const stats = loggingManager.getLogStats();
    console.log('Logging Statistics:', stats);
    // Show different log channels
    loggingManager.showChannel('main');
    // Export logs
    // loggingManager.exportLogs(); // Uncomment to test export
    // Change log level dynamically
    loggingManager.setLogLevel(loggingManager_1.LogLevel.DEBUG);
    // Enable/disable categories
    loggingManager.setEnabledCategories([loggingManager_1.LogCategory.GENERAL, loggingManager_1.LogCategory.PROCESS]);
}
// VS Code command to start example service
function registerExampleCommands(context) {
    const exampleService = new ExampleService();
    context.subscriptions.push(vscode.commands.registerCommand('alephscript.example.start', () => {
        exampleService.start();
        vscode.window.showInformationMessage('Example service started - check logs!');
    }), vscode.commands.registerCommand('alephscript.example.stop', () => {
        exampleService.stop();
        vscode.window.showInformationMessage('Example service stopped');
    }), vscode.commands.registerCommand('alephscript.example.testLevels', () => {
        exampleService.testAllLogLevels();
        vscode.window.showInformationMessage('Test log levels generated - check logs!');
    }), vscode.commands.registerCommand('alephscript.example.testCategories', () => {
        exampleService.testWithDifferentCategories();
        vscode.window.showInformationMessage('Test categories generated - check logs!');
    }), vscode.commands.registerCommand('alephscript.example.testError', () => {
        exampleService.demonstrateErrorHandling();
        vscode.window.showInformationMessage('Error demonstration logged - check logs!');
    }), vscode.commands.registerCommand('alephscript.example.simulate', () => {
        exampleService.simulateProcessingTask();
        vscode.window.showInformationMessage('Processing simulation started - watch logs!');
    }), vscode.commands.registerCommand('alephscript.example.features', () => {
        demonstrateLoggingFeatures();
        vscode.window.showInformationMessage('Logging features demonstrated - check console!');
    }));
}
//# sourceMappingURL=loggingExample.js.map