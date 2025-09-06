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
exports.AIAssistantService = exports.AIInteractionType = exports.AICapability = void 0;
const vscode = __importStar(require("vscode"));
const loggingManager_1 = require("../loggingManager");
const errorBoundary_1 = require("./errorBoundary");
const analyticsService_1 = require("./analyticsService");
/**
 * AI Assistant capabilities and functions
 */
var AICapability;
(function (AICapability) {
    AICapability["CODE_ANALYSIS"] = "code_analysis";
    AICapability["COMMAND_SUGGESTION"] = "command_suggestion";
    AICapability["ERROR_DIAGNOSIS"] = "error_diagnosis";
    AICapability["WORKFLOW_OPTIMIZATION"] = "workflow_optimization";
    AICapability["PATTERN_RECOGNITION"] = "pattern_recognition";
    AICapability["SMART_COMPLETION"] = "smart_completion";
    AICapability["AUTOMATED_FIXES"] = "automated_fixes";
    AICapability["PERFORMANCE_INSIGHTS"] = "performance_insights";
})(AICapability || (exports.AICapability = AICapability = {}));
/**
 * AI Assistant interaction types
 */
var AIInteractionType;
(function (AIInteractionType) {
    AIInteractionType["CHAT"] = "chat";
    AIInteractionType["SUGGESTION"] = "suggestion";
    AIInteractionType["ANALYSIS"] = "analysis";
    AIInteractionType["AUTOMATION"] = "automation";
    AIInteractionType["DIAGNOSIS"] = "diagnosis";
    AIInteractionType["OPTIMIZATION"] = "optimization";
})(AIInteractionType || (exports.AIInteractionType = AIInteractionType = {}));
/**
 * AI Assistant Service for intelligent automation and assistance
 */
class AIAssistantService {
    constructor(loggingManager, configService, analyticsService) {
        this.requestHistory = new Map();
        this.responseHistory = new Map();
        this.requestCounter = 0;
        this.maxHistorySize = 1000;
        this.defaultConfidenceThreshold = 0.7;
        this.loggingManager = loggingManager;
        this.configService = configService;
        this.analyticsService = analyticsService;
        this.logger = (0, loggingManager_1.createLogger)(loggingManager_1.LogCategory.EXTENSION, 'AIAssistantService');
        this.sessionId = this.generateSessionId();
        this.learningData = this.initializeLearningData();
        this.logger.info('AIAssistantService initialized');
    }
    /**
     * Get singleton instance
     */
    static getInstance(loggingManager, configService, analyticsService) {
        if (!AIAssistantService.instance) {
            if (!loggingManager || !configService || !analyticsService) {
                throw new Error('AIAssistantService requires LoggingManager, ConfigurationService, and AnalyticsService for first initialization');
            }
            AIAssistantService.instance = new AIAssistantService(loggingManager, configService, analyticsService);
        }
        return AIAssistantService.instance;
    }
    /**
     * Generate unique session ID
     */
    generateSessionId() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2);
        return `ai_session_${timestamp}_${random}`;
    }
    /**
     * Initialize learning data structure
     */
    initializeLearningData() {
        return {
            user_patterns: {
                most_used_commands: [],
                peak_activity_times: [],
                preferred_workflows: [],
                common_errors: []
            },
            workspace_patterns: {
                file_types: [],
                project_structure: {},
                dependencies: []
            },
            performance_baselines: {
                startup_time: 0,
                command_response_times: {},
                memory_usage: []
            }
        };
    }
    /**
     * Process AI request and generate intelligent response
     */
    async processRequest(request) {
        return await errorBoundary_1.errorBoundary.wrapAsync(async () => {
            const startTime = Date.now();
            this.requestCounter++;
            // Store request in history
            this.requestHistory.set(request.id, request);
            this.rotateHistory();
            // Track analytics
            await this.analyticsService.trackEvent(analyticsService_1.AnalyticsEventType.USER_INTERACTION, 'ai_assistant', {
                request_type: request.type,
                capability: request.capability,
                has_context: Object.keys(request.context).length > 0
            });
            let response;
            // Route to appropriate processor based on capability
            switch (request.capability) {
                case AICapability.CODE_ANALYSIS:
                    response = await this.processCodeAnalysis(request);
                    break;
                case AICapability.COMMAND_SUGGESTION:
                    response = await this.processCommandSuggestion(request);
                    break;
                case AICapability.ERROR_DIAGNOSIS:
                    response = await this.processErrorDiagnosis(request);
                    break;
                case AICapability.WORKFLOW_OPTIMIZATION:
                    response = await this.processWorkflowOptimization(request);
                    break;
                case AICapability.PATTERN_RECOGNITION:
                    response = await this.processPatternRecognition(request);
                    break;
                case AICapability.SMART_COMPLETION:
                    response = await this.processSmartCompletion(request);
                    break;
                case AICapability.AUTOMATED_FIXES:
                    response = await this.processAutomatedFixes(request);
                    break;
                case AICapability.PERFORMANCE_INSIGHTS:
                    response = await this.processPerformanceInsights(request);
                    break;
                default:
                    response = await this.processGenericRequest(request);
            }
            response.metadata.processing_time = Date.now() - startTime;
            // Store response in history
            this.responseHistory.set(response.id, response);
            // Update learning data
            await this.updateLearningData(request, response);
            this.logger.info(`AI request processed: ${request.capability} (${response.metadata.processing_time}ms)`);
            return response;
        }, 'AIAssistantService.processRequest', loggingManager_1.LogCategory.EXTENSION) || this.createErrorResponse(request.id, 'Processing failed');
    }
    /**
     * Process code analysis requests
     */
    async processCodeAnalysis(request) {
        const response = this.createBaseResponse(request, AIInteractionType.ANALYSIS);
        const analysis = {
            id: this.generateId('analysis'),
            type: 'code_quality',
            scope: request.context.activeFile || 'workspace',
            findings: await this.analyzeCode(request.context),
            summary: 'Code analysis completed',
            recommendations: [],
            score: 85
        };
        response.content.analysis = analysis;
        response.confidence = 85;
        response.status = 'success';
        return response;
    }
    /**
     * Process command suggestion requests
     */
    async processCommandSuggestion(request) {
        const response = this.createBaseResponse(request, AIInteractionType.SUGGESTION);
        const suggestions = await this.generateCommandSuggestions(request.context, request.data);
        response.content.suggestions = suggestions;
        response.confidence = suggestions.length > 0 ? 90 : 50;
        response.status = suggestions.length > 0 ? 'success' : 'partial';
        return response;
    }
    /**
     * Process error diagnosis requests
     */
    async processErrorDiagnosis(request) {
        const response = this.createBaseResponse(request, AIInteractionType.DIAGNOSIS);
        const diagnosis = await this.diagnoseError(request.context.error, request.context);
        response.content.message = diagnosis.explanation;
        response.content.suggestions = diagnosis.solutions;
        response.confidence = diagnosis.confidence;
        response.status = 'success';
        return response;
    }
    /**
     * Process workflow optimization requests
     */
    async processWorkflowOptimization(request) {
        const response = this.createBaseResponse(request, AIInteractionType.OPTIMIZATION);
        const optimizations = await this.optimizeWorkflow(request.context);
        response.content.insights = optimizations.insights;
        response.content.actions = optimizations.actions;
        response.confidence = 75;
        response.status = 'success';
        return response;
    }
    /**
     * Process pattern recognition requests
     */
    async processPatternRecognition(request) {
        const response = this.createBaseResponse(request, AIInteractionType.ANALYSIS);
        const patterns = await this.recognizePatterns();
        response.content.insights = patterns;
        response.confidence = 80;
        response.status = 'success';
        return response;
    }
    /**
     * Process smart completion requests
     */
    async processSmartCompletion(request) {
        const response = this.createBaseResponse(request, AIInteractionType.SUGGESTION);
        const completions = await this.generateSmartCompletions(request.context);
        response.content.suggestions = completions;
        response.confidence = completions.length > 0 ? 85 : 40;
        response.status = completions.length > 0 ? 'success' : 'partial';
        return response;
    }
    /**
     * Process automated fixes requests
     */
    async processAutomatedFixes(request) {
        const response = this.createBaseResponse(request, AIInteractionType.AUTOMATION);
        const fixes = await this.generateAutomatedFixes(request.context);
        response.content.actions = fixes;
        response.confidence = fixes.length > 0 ? 90 : 30;
        response.status = fixes.length > 0 ? 'success' : 'partial';
        return response;
    }
    /**
     * Process performance insights requests
     */
    async processPerformanceInsights(request) {
        const response = this.createBaseResponse(request, AIInteractionType.ANALYSIS);
        const insights = await this.generatePerformanceInsights();
        response.content.insights = insights;
        response.confidence = 88;
        response.status = 'success';
        return response;
    }
    /**
     * Process generic requests
     */
    async processGenericRequest(request) {
        const response = this.createBaseResponse(request, AIInteractionType.CHAT);
        response.content.message = `I understand you're asking about ${request.capability}. Let me analyze this for you...`;
        response.confidence = 50;
        response.status = 'partial';
        return response;
    }
    /**
     * Create base response structure
     */
    createBaseResponse(request, type) {
        return {
            id: this.generateId('response'),
            request_id: request.id,
            type,
            status: 'success',
            confidence: 50,
            content: {},
            metadata: {
                processing_time: 0,
                model_used: 'alephscript-ai-v1',
                temperature: 0.7
            },
            timestamp: new Date().toISOString()
        };
    }
    /**
     * Create error response
     */
    createErrorResponse(requestId, error) {
        return {
            id: this.generateId('response'),
            request_id: requestId,
            type: AIInteractionType.CHAT,
            status: 'error',
            confidence: 0,
            content: {
                message: `I encountered an error: ${error}. Please try again.`
            },
            metadata: {
                processing_time: 0,
                model_used: 'error-handler'
            },
            timestamp: new Date().toISOString()
        };
    }
    /**
     * Generate unique ID for AI components
     */
    generateId(type) {
        return `${type}_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    }
    /**
     * Analyze code based on context
     */
    async analyzeCode(context) {
        const findings = [];
        // Mock code analysis - in real implementation, this would use actual code analysis
        if (context.activeFile) {
            findings.push({
                id: this.generateId('finding'),
                severity: 'suggestion',
                category: 'code_quality',
                title: 'Consider adding type annotations',
                description: 'Adding explicit type annotations improves code readability and catches potential type errors.',
                location: {
                    file: context.activeFile,
                    line: 1,
                    column: 1
                },
                fix_suggestion: {
                    description: 'Add TypeScript type annotations to function parameters and return types',
                    automated: false,
                    code: '// Add type annotations like: function example(param: string): number'
                }
            });
        }
        return findings;
    }
    /**
     * Generate command suggestions based on context
     */
    async generateCommandSuggestions(context, data) {
        const suggestions = [];
        // Generate suggestions based on current context
        if (context.activeFile?.endsWith('.ts') || context.activeFile?.endsWith('.js')) {
            suggestions.push({
                id: this.generateId('suggestion'),
                type: 'command',
                title: 'Format Document',
                description: 'Format the current TypeScript/JavaScript file for better readability',
                confidence: 85,
                priority: 'medium',
                action: {
                    type: 'execute_command',
                    payload: { command: 'editor.action.formatDocument' }
                },
                benefits: ['Improved code readability', 'Consistent formatting'],
                risks: []
            });
        }
        if (context.userIntent?.toLowerCase().includes('webview')) {
            suggestions.push({
                id: this.generateId('suggestion'),
                type: 'command',
                title: 'Open WebRTC UI',
                description: 'Launch the WebRTC interface for real-time communication',
                confidence: 90,
                priority: 'high',
                action: {
                    type: 'execute_command',
                    payload: { command: 'alephscript.webview.openWebRTC' }
                },
                benefits: ['Quick access to WebRTC features', 'Real-time communication'],
                risks: []
            });
        }
        return suggestions;
    }
    /**
     * Diagnose errors and provide solutions
     */
    async diagnoseError(error, context) {
        if (!error) {
            return {
                explanation: 'No error information provided.',
                solutions: [],
                confidence: 0
            };
        }
        const solutions = [];
        let explanation = `Analyzing error: ${error}`;
        let confidence = 70;
        // Error pattern matching
        if (error.includes('Cannot find module')) {
            explanation = 'This appears to be a missing module error. The application is trying to import a module that is not installed or cannot be found.';
            confidence = 90;
            solutions.push({
                id: this.generateId('solution'),
                type: 'command',
                title: 'Install Missing Dependencies',
                description: 'Run npm install to install missing dependencies',
                confidence: 85,
                priority: 'high',
                action: {
                    type: 'execute_command',
                    payload: { command: 'workbench.action.terminal.new' }
                },
                benefits: ['Resolves missing module errors', 'Installs required dependencies'],
                risks: ['May install unnecessary packages']
            });
        }
        else if (error.includes('TypeScript')) {
            explanation = 'This appears to be a TypeScript compilation error. Check your type definitions and syntax.';
            confidence = 85;
            solutions.push({
                id: this.generateId('solution'),
                type: 'command',
                title: 'Check TypeScript Configuration',
                description: 'Review tsconfig.json and type definitions',
                confidence: 80,
                priority: 'medium',
                action: {
                    type: 'open_file',
                    payload: { file: 'tsconfig.json' }
                },
                benefits: ['Identifies TypeScript configuration issues'],
                risks: []
            });
        }
        return { explanation, solutions, confidence };
    }
    /**
     * Optimize workflow based on usage patterns
     */
    async optimizeWorkflow(context) {
        const insights = [];
        const actions = [];
        // Analyze current workflow and suggest optimizations
        insights.push({
            id: this.generateId('insight'),
            category: 'productivity',
            title: 'Frequent Command Usage Detected',
            description: 'You frequently use certain commands that could be optimized with keyboard shortcuts',
            impact: 'medium',
            actionable: true,
            data: {
                metrics: { 'commands_per_hour': 15 }
            }
        });
        actions.push({
            id: this.generateId('action'),
            type: 'configuration',
            title: 'Set Up Custom Keybindings',
            description: 'Configure custom keyboard shortcuts for frequently used commands',
            automated: false,
            safe: true,
            reversible: true,
            payload: {
                config_changes: [{
                        key: 'keybindings',
                        value: [{ 'key': 'ctrl+shift+a', 'command': 'alephscript.analytics.showDashboard' }],
                        scope: vscode.ConfigurationTarget.Global
                    }]
            }
        });
        return { insights, actions };
    }
    /**
     * Recognize patterns in user behavior
     */
    async recognizePatterns() {
        const insights = [];
        // Analyze usage patterns from analytics
        const analyticsData = await this.analyticsService.getAnalyticsAggregation();
        if (analyticsData.most_used_commands.length > 0) {
            insights.push({
                id: this.generateId('insight'),
                category: 'usage',
                title: 'Command Usage Pattern Identified',
                description: `Your most used command is "${analyticsData.most_used_commands[0].command}" with ${analyticsData.most_used_commands[0].count} uses`,
                impact: 'medium',
                actionable: true,
                data: {
                    metrics: {
                        top_command_usage: analyticsData.most_used_commands[0].count,
                        total_commands: analyticsData.most_used_commands.reduce((sum, cmd) => sum + cmd.count, 0)
                    }
                }
            });
        }
        return insights;
    }
    /**
     * Generate smart completions
     */
    async generateSmartCompletions(context) {
        const completions = [];
        if (context.selection && context.activeFile?.endsWith('.ts')) {
            completions.push({
                id: this.generateId('completion'),
                type: 'code',
                title: 'Add Error Handling',
                description: 'Wrap the selected code in a try-catch block',
                confidence: 80,
                priority: 'medium',
                action: {
                    type: 'insert_code',
                    payload: {
                        code: `try {\n    ${context.selection}\n} catch (error) {\n    console.error('Error:', error);\n}`
                    }
                },
                benefits: ['Better error handling', 'Improved code robustness'],
                risks: []
            });
        }
        return completions;
    }
    /**
     * Generate automated fixes
     */
    async generateAutomatedFixes(context) {
        const fixes = [];
        // Example automated fix
        fixes.push({
            id: this.generateId('fix'),
            type: 'command',
            title: 'Fix Import Statements',
            description: 'Automatically organize and fix import statements',
            automated: true,
            safe: true,
            reversible: true,
            payload: {
                command: 'editor.action.organizeImports'
            }
        });
        return fixes;
    }
    /**
     * Generate performance insights
     */
    async generatePerformanceInsights() {
        const insights = [];
        const analyticsData = await this.analyticsService.getAnalyticsAggregation();
        insights.push({
            id: this.generateId('insight'),
            category: 'performance',
            title: 'Extension Startup Performance',
            description: `Your extension startup time is ${analyticsData.performance_summary.avg_startup_time}ms`,
            impact: analyticsData.performance_summary.avg_startup_time > 2000 ? 'high' : 'low',
            actionable: analyticsData.performance_summary.avg_startup_time > 2000,
            data: {
                metrics: {
                    startup_time: analyticsData.performance_summary.avg_startup_time,
                    command_time: analyticsData.performance_summary.avg_command_execution_time
                }
            }
        });
        return insights;
    }
    /**
     * Update learning data based on interactions
     */
    async updateLearningData(request, response) {
        // Update user patterns based on request/response
        if (request.context.command) {
            const existingCommand = this.learningData.user_patterns.most_used_commands.find(cmd => cmd.command === request.context.command);
            if (existingCommand) {
                existingCommand.frequency++;
            }
            else {
                this.learningData.user_patterns.most_used_commands.push({
                    command: request.context.command,
                    frequency: 1
                });
            }
        }
        // Update performance baselines
        if (response.metadata.processing_time > 0) {
            const capability = request.capability;
            if (!this.learningData.performance_baselines.command_response_times[capability]) {
                this.learningData.performance_baselines.command_response_times[capability] = response.metadata.processing_time;
            }
            else {
                // Moving average
                this.learningData.performance_baselines.command_response_times[capability] =
                    (this.learningData.performance_baselines.command_response_times[capability] + response.metadata.processing_time) / 2;
            }
        }
    }
    /**
     * Rotate history to prevent memory leaks
     */
    rotateHistory() {
        if (this.requestHistory.size > this.maxHistorySize) {
            const oldestKey = this.requestHistory.keys().next().value;
            if (oldestKey) {
                this.requestHistory.delete(oldestKey);
            }
        }
        if (this.responseHistory.size > this.maxHistorySize) {
            const oldestKey = this.responseHistory.keys().next().value;
            if (oldestKey) {
                this.responseHistory.delete(oldestKey);
            }
        }
    }
    /**
     * Get AI assistant statistics
     */
    getStatistics() {
        const responses = Array.from(this.responseHistory.values());
        const successfulResponses = responses.filter(r => r.status === 'success');
        const capabilitiesUsed = {};
        Array.from(this.requestHistory.values()).forEach(req => {
            capabilitiesUsed[req.capability] = (capabilitiesUsed[req.capability] || 0) + 1;
        });
        return {
            total_requests: this.requestHistory.size,
            success_rate: responses.length > 0 ? (successfulResponses.length / responses.length) * 100 : 0,
            avg_confidence: responses.length > 0 ? responses.reduce((sum, r) => sum + r.confidence, 0) / responses.length : 0,
            avg_processing_time: responses.length > 0 ? responses.reduce((sum, r) => sum + r.metadata.processing_time, 0) / responses.length : 0,
            capabilities_used: capabilitiesUsed
        };
    }
    /**
     * Get learning data for insights
     */
    getLearningData() {
        return { ...this.learningData };
    }
    /**
     * Clear AI assistant history and reset learning data
     */
    async clearHistory() {
        await errorBoundary_1.errorBoundary.wrapAsync(async () => {
            this.requestHistory.clear();
            this.responseHistory.clear();
            this.learningData = this.initializeLearningData();
            this.requestCounter = 0;
            this.logger.info('AI Assistant history and learning data cleared');
        }, 'AIAssistantService.clearHistory', loggingManager_1.LogCategory.EXTENSION);
    }
    /**
     * Dispose resources
     */
    dispose() {
        this.requestHistory.clear();
        this.responseHistory.clear();
        this.logger.info('AIAssistantService disposed');
    }
}
exports.AIAssistantService = AIAssistantService;
//# sourceMappingURL=aiAssistantService.js.map