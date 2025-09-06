module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    
    // Test file patterns
    testMatch: [
        '**/tests/**/*.test.ts',
        '**/tests/**/*.spec.ts'
    ],
    
    // Coverage configuration
    collectCoverage: true,
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html', 'json'],
    collectCoverageFrom: [
        'src/**/*.ts',
        '!src/**/*.d.ts',
        '!src/**/*.test.ts',
        '!src/**/*.spec.ts'
    ],
    
    // Coverage thresholds
    coverageThreshold: {
        global: {
            branches: 75,
            functions: 80,
            lines: 85,
            statements: 85
        }
    },
    
    // Setup files
    setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
    
    // Module name mapping
    moduleNameMapper: {
        '^vscode$': '<rootDir>/tests/mocks/vscode.mock.js'
    },
    
    // Transform configuration
    transform: {
        '^.+\\.ts$': 'ts-jest'
    },
    
    // Test timeout
    testTimeout: 10000,
    
    // Verbose output
    verbose: true,
    
    // Ignore patterns
    testPathIgnorePatterns: [
        '/node_modules/',
        '/out/',
        '/dist/'
    ],
    
    // Module file extensions
    moduleFileExtensions: ['ts', 'js', 'json'],
    
    // Clear mocks automatically
    clearMocks: true,
    
    // Restore mocks after each test
    restoreMocks: true,
    
    // Jest environment options
    testEnvironmentOptions: {
        node: {
            global: true
        }
    }
};
