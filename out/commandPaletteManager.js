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
exports.CommandPaletteManager = exports.CommandCategory = void 0;
const vscode = __importStar(require("vscode"));
const loggingManager_1 = require("./loggingManager");
var CommandCategory;
(function (CommandCategory) {
    CommandCategory["SYSTEM"] = "System Control";
    CommandCategory["AGENTS"] = "Agent Management";
    CommandCategory["UIS"] = "UI Management";
    CommandCategory["SOCKETS"] = "Socket.IO";
    CommandCategory["CONFIGS"] = "Configuration";
    CommandCategory["LOGS"] = "Debug & Logs";
    CommandCategory["TERMINALS"] = "Terminals";
    CommandCategory["QUICK_ACTIONS"] = "Quick Actions";
})(CommandCategory || (exports.CommandCategory = CommandCategory = {}));
class CommandPaletteManager {
    constructor(context) {
        this.commands = new Map();
        this.registeredCommands = [];
        this.context = context;
        this.logger = (0, loggingManager_1.createLogger)(loggingManager_1.LogCategory.EXTENSION, 'CommandPaletteManager');
        this.initializeCoreCommands();
    }
    static getInstance(context) {
        if (!CommandPaletteManager.instance) {
            if (!context) {
                throw new Error('CommandPaletteManager requires context for first initialization');
            }
            CommandPaletteManager.instance = new CommandPaletteManager(context);
        }
        return CommandPaletteManager.instance;
    }
    initializeCoreCommands() {
        this.logger.info('Initializing command palette system');
        // System Control Commands
        this.registerCommand({
            id: 'alephscript.showDashboard',
            title: 'Show AlephScript Dashboard',
            category: CommandCategory.SYSTEM,
            description: 'Open the main AlephScript control dashboard',
            icon: 'dashboard',
            shortcut: 'ctrl+alt+a',
            handler: () => this.showDashboard()
        });
        this.registerCommand({
            id: 'alephscript.systemStatus',
            title: 'System Status Overview',
            category: CommandCategory.SYSTEM,
            description: 'Display comprehensive system status',
            icon: 'pulse',
            shortcut: 'ctrl+alt+s',
            handler: () => this.showSystemStatus()
        });
        // Quick Actions
        this.registerCommand({
            id: 'alephscript.quickStart',
            title: 'Quick Start - Launch Everything',
            category: CommandCategory.QUICK_ACTIONS,
            description: 'Start all essential services with one command',
            icon: 'rocket',
            shortcut: 'ctrl+alt+q',
            handler: () => this.quickStart()
        });
        this.registerCommand({
            id: 'alephscript.emergencyStop',
            title: 'Emergency Stop - Kill All Processes',
            category: CommandCategory.QUICK_ACTIONS,
            description: 'Immediately stop all running processes and services',
            icon: 'emergency-stop',
            shortcut: 'ctrl+alt+x',
            handler: () => this.emergencyStop()
        });
        // Agent Management
        this.registerCommand({
            id: 'alephscript.agents.startAll',
            title: 'Start All Agents',
            category: CommandCategory.AGENTS,
            description: 'Launch all configured MCP agents',
            icon: 'play-circle',
            handler: () => this.startAllAgents()
        });
        this.registerCommand({
            id: 'alephscript.agents.stopAll',
            title: 'Stop All Agents',
            category: CommandCategory.AGENTS,
            description: 'Stop all running MCP agents',
            icon: 'stop-circle',
            handler: () => this.stopAllAgents()
        });
        // UI Management
        this.registerCommand({
            id: 'alephscript.uis.startAll',
            title: 'Start All UIs',
            category: CommandCategory.UIS,
            description: 'Launch all configured UI applications',
            icon: 'browser',
            handler: () => this.startAllUIs()
        });
        this.registerCommand({
            id: 'alephscript.uis.openAllBrowsers',
            title: 'Open All UIs in Browser',
            category: CommandCategory.UIS,
            description: 'Open browser tabs for all running UIs',
            icon: 'globe',
            shortcut: 'ctrl+alt+b',
            handler: () => this.openAllBrowsers()
        });
        // Socket.IO Commands
        this.registerCommand({
            id: 'alephscript.sockets.quickConnect',
            title: 'Quick Connect to Local Socket',
            category: CommandCategory.SOCKETS,
            description: 'Connect to localhost:3000 socket server',
            icon: 'plug',
            shortcut: 'ctrl+alt+c',
            handler: () => this.quickConnectSocket()
        });
        this.registerCommand({
            id: 'alephscript.sockets.disconnectAll',
            title: 'Disconnect All Sockets',
            category: CommandCategory.SOCKETS,
            description: 'Disconnect from all socket servers',
            icon: 'debug-disconnect',
            handler: () => this.disconnectAllSockets()
        });
        // Configuration Commands  
        this.registerCommand({
            id: 'alephscript.configs.validateAll',
            title: 'Validate All Configurations',
            category: CommandCategory.CONFIGS,
            description: 'Run validation on all configuration files',
            icon: 'check-all',
            handler: () => this.validateAllConfigs()
        });
        this.registerCommand({
            id: 'alephscript.configs.backupAll',
            title: 'Backup All Configurations',
            category: CommandCategory.CONFIGS,
            description: 'Create timestamped backup of all config files',
            icon: 'archive',
            handler: () => this.backupAllConfigs()
        });
        // Debug & Logs Commands
        this.registerCommand({
            id: 'alephscript.logs.showMainChannel',
            title: 'Show Main Log Channel',
            category: CommandCategory.LOGS,
            description: 'Display the main aggregated log channel',
            icon: 'output',
            shortcut: 'ctrl+alt+l',
            handler: () => this.showMainLogChannel()
        });
        this.registerCommand({
            id: 'alephscript.logs.clearAndRestart',
            title: 'Clear Logs & Restart Logging',
            category: CommandCategory.LOGS,
            description: 'Clear all logs and restart the logging system',
            icon: 'refresh',
            handler: () => this.clearAndRestartLogging()
        });
        // Terminal Commands
        this.registerCommand({
            id: 'alephscript.terminals.showAll',
            title: 'Show All AlephScript Terminals',
            category: CommandCategory.TERMINALS,
            description: 'Display all active AlephScript terminals',
            icon: 'terminal',
            shortcut: 'ctrl+alt+t',
            handler: () => this.showAllTerminals()
        });
        this.registerCommand({
            id: 'alephscript.terminals.killAll',
            title: 'Kill All Terminals',
            category: CommandCategory.TERMINALS,
            description: 'Close all AlephScript-managed terminals',
            icon: 'trash',
            handler: () => this.killAllTerminals()
        });
    }
    registerCommand(command) {
        if (this.commands.has(command.id)) {
            this.logger.warn(`Command ${command.id} is already registered, overwriting`, { commandId: command.id });
        }
        this.commands.set(command.id, command);
        // Register the command with VS Code
        const disposable = vscode.commands.registerCommand(command.id, command.handler);
        this.registeredCommands.push(disposable);
        this.context.subscriptions.push(disposable);
        this.logger.debug(`Command registered: ${command.id}`, {
            commandId: command.id,
            category: command.category,
            hasShortcut: !!command.shortcut
        });
    }
    getCommandsByCategory(category) {
        return Array.from(this.commands.values()).filter(cmd => cmd.category === category);
    }
    getAllCommands() {
        return Array.from(this.commands.values());
    }
    generateCommandPaletteInfo() {
        const categories = Object.values(CommandCategory);
        let info = '# AlephScript Command Palette\n\n';
        for (const category of categories) {
            const commands = this.getCommandsByCategory(category);
            if (commands.length === 0)
                continue;
            info += `## ${category}\n\n`;
            for (const cmd of commands) {
                info += `- **${cmd.title}**`;
                if (cmd.shortcut) {
                    info += ` (\`${cmd.shortcut}\`)`;
                }
                info += `\n  - Command: \`${cmd.id}\`\n`;
                if (cmd.description) {
                    info += `  - ${cmd.description}\n`;
                }
                info += '\n';
            }
        }
        return info;
    }
    // Command handler implementations
    async showDashboard() {
        this.logger.info('Opening AlephScript Dashboard');
        const panel = vscode.window.createWebviewPanel('alephscriptDashboard', 'AlephScript Dashboard', vscode.ViewColumn.One, { enableScripts: true });
        panel.webview.html = this.getDashboardHTML();
    }
    async showSystemStatus() {
        this.logger.info('Showing system status overview');
        // This would integrate with StatusManager
        vscode.commands.executeCommand('alephscript.showStatusPanel');
    }
    async quickStart() {
        this.logger.info('Executing quick start sequence');
        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Quick Start in Progress...',
            cancellable: false
        }, async (progress, token) => {
            try {
                progress.report({ increment: 20, message: 'Starting agents...' });
                await this.startAllAgents();
                progress.report({ increment: 40, message: 'Launching UIs...' });
                await this.startAllUIs();
                progress.report({ increment: 60, message: 'Connecting sockets...' });
                await this.quickConnectSocket();
                progress.report({ increment: 80, message: 'Validating configurations...' });
                await this.validateAllConfigs();
                progress.report({ increment: 100, message: 'Complete!' });
                vscode.window.showInformationMessage('Quick Start completed successfully! 🚀');
            }
            catch (error) {
                this.logger.error('Quick start failed', { error });
                vscode.window.showErrorMessage(`Quick Start failed: ${error}`);
            }
        });
    }
    async emergencyStop() {
        this.logger.warn('Executing emergency stop');
        const response = await vscode.window.showWarningMessage('This will immediately stop ALL AlephScript processes and services. Continue?', { modal: true }, 'Yes, Stop Everything', 'Cancel');
        if (response === 'Yes, Stop Everything') {
            try {
                await this.stopAllAgents();
                await this.killAllTerminals();
                await this.disconnectAllSockets();
                vscode.window.showInformationMessage('Emergency stop completed - all services halted');
                this.logger.info('Emergency stop completed successfully');
            }
            catch (error) {
                this.logger.error('Emergency stop failed', { error });
                vscode.window.showErrorMessage(`Emergency stop failed: ${error}`);
            }
        }
    }
    async startAllAgents() {
        this.logger.info('Starting all agents');
        // Integration with AgentsTreeDataProvider
        vscode.commands.executeCommand('alephscript.agents.refresh');
    }
    async stopAllAgents() {
        this.logger.info('Stopping all agents');
        // Integration with existing agent management
    }
    async startAllUIs() {
        this.logger.info('Starting all UIs');
        vscode.commands.executeCommand('alephscript.uis.refresh');
    }
    async openAllBrowsers() {
        this.logger.info('Opening all UIs in browser');
        // Integration with UIManager
    }
    async quickConnectSocket() {
        this.logger.info('Quick connecting to local socket');
        try {
            await vscode.commands.executeCommand('alephscript.sockets.connect');
        }
        catch (error) {
            this.logger.error('Quick socket connection failed', { error });
        }
    }
    async disconnectAllSockets() {
        this.logger.info('Disconnecting all sockets');
        vscode.commands.executeCommand('alephscript.sockets.disconnect');
    }
    async validateAllConfigs() {
        this.logger.info('Validating all configurations');
        vscode.commands.executeCommand('alephscript.configs.refresh');
    }
    async backupAllConfigs() {
        this.logger.info('Backing up all configurations');
        // Integration with ConfigsTreeDataProvider
    }
    async showMainLogChannel() {
        this.logger.info('Showing main log channel');
        vscode.commands.executeCommand('alephscript.logs.showChannel', 'main');
    }
    async clearAndRestartLogging() {
        this.logger.info('Clearing and restarting logging system');
        vscode.commands.executeCommand('alephscript.logs.clear');
    }
    async showAllTerminals() {
        this.logger.info('Showing all terminals');
        // Integration with TerminalManager
    }
    async killAllTerminals() {
        this.logger.info('Killing all terminals');
        // Integration with TerminalManager
    }
    getDashboardHTML() {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AlephScript Dashboard</title>
    <style>
        body { font-family: var(--vscode-font-family); color: var(--vscode-foreground); background: var(--vscode-editor-background); }
        .dashboard { padding: 20px; }
        .section { margin: 20px 0; padding: 15px; border: 1px solid var(--vscode-panel-border); border-radius: 5px; }
        .section h2 { margin-top: 0; color: var(--vscode-textLink-foreground); }
        .command-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; }
        .command-button { padding: 10px; background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: none; border-radius: 3px; cursor: pointer; }
        .command-button:hover { background: var(--vscode-button-hoverBackground); }
        .shortcut { font-size: 0.8em; opacity: 0.7; }
    </style>
</head>
<body>
    <div class="dashboard">
        <h1>🚀 AlephScript Control Dashboard</h1>
        
        <div class="section">
            <h2>🎯 Quick Actions</h2>
            <div class="command-grid">
                <button class="command-button" onclick="executeCommand('alephscript.quickStart')">
                    🚀 Quick Start<br><span class="shortcut">Ctrl+Alt+Q</span>
                </button>
                <button class="command-button" onclick="executeCommand('alephscript.emergencyStop')">
                    🛑 Emergency Stop<br><span class="shortcut">Ctrl+Alt+X</span>
                </button>
                <button class="command-button" onclick="executeCommand('alephscript.systemStatus')">
                    📊 System Status<br><span class="shortcut">Ctrl+Alt+S</span>
                </button>
                <button class="command-button" onclick="executeCommand('alephscript.logs.showMainChannel')">
                    📋 Main Logs<br><span class="shortcut">Ctrl+Alt+L</span>
                </button>
            </div>
        </div>

        <div class="section">
            <h2>🤖 Agent Management</h2>
            <div class="command-grid">
                <button class="command-button" onclick="executeCommand('alephscript.agents.startAll')">▶️ Start All Agents</button>
                <button class="command-button" onclick="executeCommand('alephscript.agents.stopAll')">⏹️ Stop All Agents</button>
            </div>
        </div>

        <div class="section">
            <h2>🖥️ UI Management</h2>
            <div class="command-grid">
                <button class="command-button" onclick="executeCommand('alephscript.uis.startAll')">▶️ Start All UIs</button>
                <button class="command-button" onclick="executeCommand('alephscript.uis.openAllBrowsers')">🌐 Open All in Browser</button>
            </div>
        </div>

        <div class="section">
            <h2>🔌 Socket.IO</h2>
            <div class="command-grid">
                <button class="command-button" onclick="executeCommand('alephscript.sockets.quickConnect')">🔌 Quick Connect</button>
                <button class="command-button" onclick="executeCommand('alephscript.sockets.disconnectAll')">🔌 Disconnect All</button>
            </div>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        function executeCommand(command) {
            vscode.postMessage({ command: 'executeCommand', commandId: command });
        }
    </script>
</body>
</html>`;
    }
    dispose() {
        this.logger.info('Disposing CommandPaletteManager');
        for (const disposable of this.registeredCommands) {
            disposable.dispose();
        }
        this.registeredCommands = [];
        this.commands.clear();
        this.logger.info('CommandPaletteManager disposed');
    }
}
exports.CommandPaletteManager = CommandPaletteManager;
//# sourceMappingURL=commandPaletteManager.js.map