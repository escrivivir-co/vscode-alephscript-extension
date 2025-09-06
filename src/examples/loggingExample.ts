import * as vscode from 'vscode';
import { LoggingManager, LogLevel, LogCategory, createLogger } from '../loggingManager';

/**
 * Example service demonstrating the logging system usage
 */
export class ExampleService {
    private logger = createLogger(LogCategory.GENERAL, 'ExampleService');
    private intervalId?: NodeJS.Timeout;

    public start(): void {
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

    private startPeriodicLogging(): void {
        this.intervalId = setInterval(() => {
            // Generate different types of logs
            const rand = Math.random();

            if (rand < 0.1) {
                // 10% chance - Error
                this.logger.error('Simulated error occurred', {
                    errorCode: 'SIM_001',
                    details: 'This is a simulated error for demonstration'
                });
            } else if (rand < 0.2) {
                // 10% chance - Warning
                this.logger.warn('Performance warning detected', {
                    metric: 'responseTime',
                    value: 1500,
                    threshold: 1000
                });
            } else if (rand < 0.6) {
                // 40% chance - Info
                const operations = ['processData', 'updateCache', 'validateInput', 'sendNotification'];
                const operation = operations[Math.floor(Math.random() * operations.length)];
                this.logger.info(`Operation completed: ${operation}`, {
                    operation,
                    duration: Math.floor(Math.random() * 100) + 'ms'
                });
            } else if (rand < 0.9) {
                // 30% chance - Debug
                this.logger.debug('Debug information', {
                    memoryUsage: process.memoryUsage(),
                    activeConnections: Math.floor(Math.random() * 50)
                });
            } else {
                // 10% chance - Trace
                this.logger.trace('Detailed trace information', {
                    callStack: ['method1', 'method2', 'method3'],
                    variables: { x: 42, y: 'test' }
                });
            }
        }, 2000); // Log something every 2 seconds
    }

    public simulateProcessingTask(): void {
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
            } else {
                this.logger.error('Processing task failed', {
                    result: 'failure',
                    reason: 'Network timeout'
                });
            }
        }, 1500);
    }

    public testAllLogLevels(): void {
        this.logger.trace('This is a TRACE message - most detailed', { level: 'trace' });
        this.logger.debug('This is a DEBUG message - diagnostic info', { level: 'debug' });
        this.logger.info('This is an INFO message - general information', { level: 'info' });
        this.logger.warn('This is a WARN message - potential issue', { level: 'warn' });
        this.logger.error('This is an ERROR message - something went wrong', { level: 'error' });
    }

    public testWithDifferentCategories(): void {
        const processLogger = createLogger(LogCategory.PROCESS, 'ExampleProcess');
        const socketLogger = createLogger(LogCategory.SOCKET, 'ExampleSocket');
        const configLogger = createLogger(LogCategory.CONFIG, 'ExampleConfig');

        processLogger.info('Process started with PID 12345');
        socketLogger.info('Socket connection established', { host: 'localhost', port: 3000 });
        configLogger.info('Configuration reloaded', { configFile: 'app.json' });
    }

    public demonstrateErrorHandling(): void {
        try {
            // Simulate an error
            throw new Error('Simulated error for demonstration');
        } catch (error) {
            this.logger.error('Caught exception in demonstrateErrorHandling', {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
                method: 'demonstrateErrorHandling'
            });
        }
    }

    public stop(): void {
        this.logger.info('ExampleService stopping');
        
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = undefined;
        }
        
        this.logger.info('ExampleService stopped successfully');
    }
}

// Function to demonstrate logging management
export function demonstrateLoggingFeatures(): void {
    const loggingManager = LoggingManager.getInstance();
    
    // Show statistics
    const stats = loggingManager.getLogStats();
    console.log('Logging Statistics:', stats);
    
    // Show different log channels
    loggingManager.showChannel('main');
    
    // Export logs
    // loggingManager.exportLogs(); // Uncomment to test export
    
    // Change log level dynamically
    loggingManager.setLogLevel(LogLevel.DEBUG);
    
    // Enable/disable categories
    loggingManager.setEnabledCategories([LogCategory.GENERAL, LogCategory.PROCESS]);
}

// VS Code command to start example service
export function registerExampleCommands(context: vscode.ExtensionContext): void {
    const exampleService = new ExampleService();
    
    context.subscriptions.push(
        vscode.commands.registerCommand('alephscript.example.start', () => {
            exampleService.start();
            vscode.window.showInformationMessage('Example service started - check logs!');
        }),
        
        vscode.commands.registerCommand('alephscript.example.stop', () => {
            exampleService.stop();
            vscode.window.showInformationMessage('Example service stopped');
        }),
        
        vscode.commands.registerCommand('alephscript.example.testLevels', () => {
            exampleService.testAllLogLevels();
            vscode.window.showInformationMessage('Test log levels generated - check logs!');
        }),
        
        vscode.commands.registerCommand('alephscript.example.testCategories', () => {
            exampleService.testWithDifferentCategories();
            vscode.window.showInformationMessage('Test categories generated - check logs!');
        }),
        
        vscode.commands.registerCommand('alephscript.example.testError', () => {
            exampleService.demonstrateErrorHandling();
            vscode.window.showInformationMessage('Error demonstration logged - check logs!');
        }),
        
        vscode.commands.registerCommand('alephscript.example.simulate', () => {
            exampleService.simulateProcessingTask();
            vscode.window.showInformationMessage('Processing simulation started - watch logs!');
        }),
        
        vscode.commands.registerCommand('alephscript.example.features', () => {
            demonstrateLoggingFeatures();
            vscode.window.showInformationMessage('Logging features demonstrated - check console!');
        })
    );
}
