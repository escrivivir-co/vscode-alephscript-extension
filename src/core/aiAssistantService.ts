import * as vscode from 'vscode';
import { LoggingManager, LogCategory, LogLevel, createLogger } from '../loggingManager';
import { ConfigurationService } from './configurationService';
import { ErrorBoundary, errorBoundary } from './errorBoundary';
import { AnalyticsService, AnalyticsEventType } from './analyticsService';

/**
 * AI Assistant capabilities and functions
 */
export enum AICapability {
    CODE_ANALYSIS = 'code_analysis',
    COMMAND_SUGGESTION = 'command_suggestion',
    ERROR_DIAGNOSIS = 'error_diagnosis',
    WORKFLOW_OPTIMIZATION = 'workflow_optimization',
    PATTERN_RECOGNITION = 'pattern_recognition',
    SMART_COMPLETION = 'smart_completion',
    AUTOMATED_FIXES = 'automated_fixes',
    PERFORMANCE_INSIGHTS = 'performance_insights'
}

/**
 * AI Assistant interaction types
 */
export enum AIInteractionType {
    CHAT = 'chat',
    SUGGESTION = 'suggestion',
    ANALYSIS = 'analysis',
    AUTOMATION = 'automation',
    DIAGNOSIS = 'diagnosis',
    OPTIMIZATION = 'optimization'
}

/**
 * AI Request structure for processing
 */
export interface AIRequest {
    id: string;
    type: AIInteractionType;
    capability: AICapability;
    context: {
        workspace?: string;
        activeFile?: string;
        selection?: string;
        command?: string;
        error?: string;
        userIntent?: string;
    };
    data: {
        [key: string]: any;
    };
    timestamp: string;
    user_id?: string;
    session_id: string;
}

/**
 * AI Response structure
 */
export interface AIResponse {
    id: string;
    request_id: string;
    type: AIInteractionType;
    status: 'success' | 'error' | 'partial';
    confidence: number; // 0-100
    content: {
        message?: string;
        suggestions?: AISuggestion[];
        analysis?: AIAnalysis;
        actions?: AIAction[];
        insights?: AIInsight[];
    };
    metadata: {
        processing_time: number;
        model_used?: string;
        tokens_used?: number;
        temperature?: number;
    };
    timestamp: string;
}

/**
 * AI Suggestion structure
 */
export interface AISuggestion {
    id: string;
    type: 'command' | 'code' | 'configuration' | 'workflow';
    title: string;
    description: string;
    confidence: number;
    priority: 'high' | 'medium' | 'low';
    action: {
        type: 'execute_command' | 'insert_code' | 'open_file' | 'show_info';
        payload: any;
    };
    benefits?: string[];
    risks?: string[];
}

/**
 * AI Analysis result structure
 */
export interface AIAnalysis {
    id: string;
    type: 'code_quality' | 'performance' | 'security' | 'architecture' | 'usage_pattern';
    scope: string;
    findings: AIFinding[];
    summary: string;
    recommendations: string[];
    score?: number; // 0-100
}

/**
 * AI Finding structure for analysis
 */
export interface AIFinding {
    id: string;
    severity: 'critical' | 'warning' | 'info' | 'suggestion';
    category: string;
    title: string;
    description: string;
    location?: {
        file: string;
        line: number;
        column: number;
        range?: vscode.Range;
    };
    fix_suggestion?: {
        description: string;
        automated: boolean;
        code?: string;
        command?: string;
    };
}

/**
 * AI Action for automated tasks
 */
export interface AIAction {
    id: string;
    type: 'command' | 'file_operation' | 'configuration' | 'workflow';
    title: string;
    description: string;
    automated: boolean;
    safe: boolean;
    reversible: boolean;
    payload: {
        command?: string;
        args?: any[];
        file_operations?: Array<{
            type: 'create' | 'modify' | 'delete';
            path: string;
            content?: string;
        }>;
        config_changes?: Array<{
            key: string;
            value: any;
            scope: vscode.ConfigurationTarget;
        }>;
    };
}

/**
 * AI Insight for intelligent observations
 */
export interface AIInsight {
    id: string;
    category: 'usage' | 'performance' | 'productivity' | 'learning' | 'optimization';
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    actionable: boolean;
    data: {
        metrics?: { [key: string]: number };
        trends?: Array<{ timestamp: string; value: number }>;
        comparisons?: { [key: string]: any };
    };
}

/**
 * AI Learning data for pattern recognition
 */
export interface AILearningData {
    user_patterns: {
        most_used_commands: Array<{ command: string; frequency: number }>;
        peak_activity_times: number[];
        preferred_workflows: Array<{ workflow: string; efficiency: number }>;
        common_errors: Array<{ error: string; frequency: number; resolution: string }>;
    };
    workspace_patterns: {
        file_types: Array<{ extension: string; count: number }>;
        project_structure: { [key: string]: number };
        dependencies: Array<{ name: string; version: string; usage: number }>;
    };
    performance_baselines: {
        startup_time: number;
        command_response_times: { [command: string]: number };
        memory_usage: Array<{ timestamp: string; usage: number }>;
    };
}

/**
 * AI Assistant Service for intelligent automation and assistance
 */
export class AIAssistantService {
    private static instance: AIAssistantService;
    private loggingManager: LoggingManager;
    private configService: ConfigurationService;
    private analyticsService: AnalyticsService;
    private logger: ReturnType<typeof createLogger>;
    
    private requestHistory: Map<string, AIRequest> = new Map();
    private responseHistory: Map<string, AIResponse> = new Map();
    private learningData: AILearningData;
    private sessionId: string;
    private requestCounter: number = 0;

    private readonly maxHistorySize = 1000;
    private readonly defaultConfidenceThreshold = 0.7;

    private constructor(
        loggingManager: LoggingManager,
        configService: ConfigurationService,
        analyticsService: AnalyticsService
    ) {
        this.loggingManager = loggingManager;
        this.configService = configService;
        this.analyticsService = analyticsService;
        this.logger = createLogger(LogCategory.EXTENSION, 'AIAssistantService');
        this.sessionId = this.generateSessionId();
        this.learningData = this.initializeLearningData();
        
        this.logger.info('AIAssistantService initialized');
    }

    /**
     * Get singleton instance
     */
    static getInstance(
        loggingManager?: LoggingManager,
        configService?: ConfigurationService,
        analyticsService?: AnalyticsService
    ): AIAssistantService {
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
    private generateSessionId(): string {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2);
        return `ai_session_${timestamp}_${random}`;
    }

    /**
     * Initialize learning data structure
     */
    private initializeLearningData(): AILearningData {
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
    async processRequest(request: AIRequest): Promise<AIResponse> {
        return await errorBoundary.wrapAsync(async (): Promise<AIResponse> => {
            const startTime = Date.now();
            this.requestCounter++;

            // Store request in history
            this.requestHistory.set(request.id, request);
            this.rotateHistory();

            // Track analytics
            await this.analyticsService.trackEvent(
                AnalyticsEventType.USER_INTERACTION,
                'ai_assistant',
                {
                    request_type: request.type,
                    capability: request.capability,
                    has_context: Object.keys(request.context).length > 0
                }
            );

            let response: AIResponse;

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

        }, 'AIAssistantService.processRequest', LogCategory.EXTENSION) || this.createErrorResponse(request.id, 'Processing failed');
    }

    /**
     * Process code analysis requests
     */
    private async processCodeAnalysis(request: AIRequest): Promise<AIResponse> {
        const response = this.createBaseResponse(request, AIInteractionType.ANALYSIS);
        
        const analysis: AIAnalysis = {
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
    private async processCommandSuggestion(request: AIRequest): Promise<AIResponse> {
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
    private async processErrorDiagnosis(request: AIRequest): Promise<AIResponse> {
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
    private async processWorkflowOptimization(request: AIRequest): Promise<AIResponse> {
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
    private async processPatternRecognition(request: AIRequest): Promise<AIResponse> {
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
    private async processSmartCompletion(request: AIRequest): Promise<AIResponse> {
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
    private async processAutomatedFixes(request: AIRequest): Promise<AIResponse> {
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
    private async processPerformanceInsights(request: AIRequest): Promise<AIResponse> {
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
    private async processGenericRequest(request: AIRequest): Promise<AIResponse> {
        const response = this.createBaseResponse(request, AIInteractionType.CHAT);
        
        response.content.message = `I understand you're asking about ${request.capability}. Let me analyze this for you...`;
        response.confidence = 50;
        response.status = 'partial';

        return response;
    }

    /**
     * Create base response structure
     */
    private createBaseResponse(request: AIRequest, type: AIInteractionType): AIResponse {
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
    private createErrorResponse(requestId: string, error: string): AIResponse {
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
    private generateId(type: string): string {
        return `${type}_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    }

    /**
     * Analyze code based on context
     */
    private async analyzeCode(context: AIRequest['context']): Promise<AIFinding[]> {
        const findings: AIFinding[] = [];

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
    private async generateCommandSuggestions(context: AIRequest['context'], data: any): Promise<AISuggestion[]> {
        const suggestions: AISuggestion[] = [];

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
    private async diagnoseError(error: string | undefined, context: AIRequest['context']): Promise<{
        explanation: string;
        solutions: AISuggestion[];
        confidence: number;
    }> {
        if (!error) {
            return {
                explanation: 'No error information provided.',
                solutions: [],
                confidence: 0
            };
        }

        const solutions: AISuggestion[] = [];
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
        } else if (error.includes('TypeScript')) {
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
    private async optimizeWorkflow(context: AIRequest['context']): Promise<{
        insights: AIInsight[];
        actions: AIAction[];
    }> {
        const insights: AIInsight[] = [];
        const actions: AIAction[] = [];

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
    private async recognizePatterns(): Promise<AIInsight[]> {
        const insights: AIInsight[] = [];

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
    private async generateSmartCompletions(context: AIRequest['context']): Promise<AISuggestion[]> {
        const completions: AISuggestion[] = [];

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
    private async generateAutomatedFixes(context: AIRequest['context']): Promise<AIAction[]> {
        const fixes: AIAction[] = [];

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
    private async generatePerformanceInsights(): Promise<AIInsight[]> {
        const insights: AIInsight[] = [];
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
    private async updateLearningData(request: AIRequest, response: AIResponse): Promise<void> {
        // Update user patterns based on request/response
        if (request.context.command) {
            const existingCommand = this.learningData.user_patterns.most_used_commands.find(
                cmd => cmd.command === request.context.command
            );
            
            if (existingCommand) {
                existingCommand.frequency++;
            } else {
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
            } else {
                // Moving average
                this.learningData.performance_baselines.command_response_times[capability] = 
                    (this.learningData.performance_baselines.command_response_times[capability] + response.metadata.processing_time) / 2;
            }
        }
    }

    /**
     * Rotate history to prevent memory leaks
     */
    private rotateHistory(): void {
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
    getStatistics(): {
        total_requests: number;
        success_rate: number;
        avg_confidence: number;
        avg_processing_time: number;
        capabilities_used: { [capability: string]: number };
    } {
        const responses = Array.from(this.responseHistory.values());
        const successfulResponses = responses.filter(r => r.status === 'success');
        
        const capabilitiesUsed: { [capability: string]: number } = {};
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
    getLearningData(): AILearningData {
        return { ...this.learningData };
    }

    /**
     * Clear AI assistant history and reset learning data
     */
    async clearHistory(): Promise<void> {
        await errorBoundary.wrapAsync(async () => {
            this.requestHistory.clear();
            this.responseHistory.clear();
            this.learningData = this.initializeLearningData();
            this.requestCounter = 0;
            
            this.logger.info('AI Assistant history and learning data cleared');
            
        }, 'AIAssistantService.clearHistory', LogCategory.EXTENSION);
    }

    /**
     * Dispose resources
     */
    dispose(): void {
        this.requestHistory.clear();
        this.responseHistory.clear();
        this.logger.info('AIAssistantService disposed');
    }
}
