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
exports.ConfigsTreeDataProvider = void 0;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class ConfigsTreeDataProvider {
    constructor() {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.fileWatchers = [];
        this.configFiles = new Map();
        this.validationCache = new Map();
        this.setupFileWatchers();
        this.refreshConfigFiles();
    }
    setupFileWatchers() {
        const patterns = [
            '**/xplus1-config.json',
            '**/webrtc-ui-config.json',
            '**/socket-config.json',
            '**/package.json',
            '**/tsconfig.json'
        ];
        patterns.forEach(pattern => {
            const watcher = vscode.workspace.createFileSystemWatcher(pattern);
            watcher.onDidCreate(uri => this.onConfigFileChanged(uri, 'created'));
            watcher.onDidChange(uri => this.onConfigFileChanged(uri, 'changed'));
            watcher.onDidDelete(uri => this.onConfigFileChanged(uri, 'deleted'));
            this.fileWatchers.push(watcher);
        });
    }
    async onConfigFileChanged(uri, changeType) {
        if (changeType === 'deleted') {
            this.configFiles.delete(uri.fsPath);
            this.validationCache.delete(uri.fsPath);
        }
        else {
            await this.processConfigFile(uri);
        }
        this.refresh();
    }
    async processConfigFile(uri) {
        try {
            const fileName = path.basename(uri.fsPath);
            const stats = await fs.promises.stat(uri.fsPath);
            const configItem = {
                id: `config-${uri.fsPath}`,
                label: fileName,
                description: this.getRelativePath(uri.fsPath),
                resourceUri: uri,
                configType: this.determineConfigType(fileName),
                lastModified: stats.mtime,
                validationStatus: 'unknown'
            };
            // Validate configuration
            const validation = await this.validateConfigFile(uri.fsPath);
            configItem.validationStatus = validation.isValid ? 'valid' : validation.errors.length > 0 ? 'invalid' : 'warning';
            this.configFiles.set(uri.fsPath, configItem);
            this.validationCache.set(uri.fsPath, validation);
        }
        catch (error) {
            console.error(`Error processing config file ${uri.fsPath}:`, error);
        }
    }
    determineConfigType(fileName) {
        if (fileName.includes('xplus1-config'))
            return 'xplus1';
        if (fileName.includes('webrtc') || fileName.includes('ui'))
            return 'ui';
        if (fileName.includes('socket'))
            return 'socket';
        if (fileName.includes('mcp'))
            return 'mcp';
        if (fileName === 'package.json' || fileName === 'tsconfig.json')
            return 'nodejs';
        if (fileName === 'launch.json' || fileName === 'settings.json')
            return 'vscode';
        if (fileName.startsWith('.env'))
            return 'env';
        return 'unknown';
    }
    getRelativePath(filePath) {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (workspaceFolder) {
            return path.relative(workspaceFolder.uri.fsPath, filePath);
        }
        return filePath;
    }
    async validateConfigFile(filePath) {
        const result = {
            isValid: true,
            errors: [],
            warnings: []
        };
        try {
            if (path.extname(filePath) === '.json') {
                const content = await fs.promises.readFile(filePath, 'utf8');
                JSON.parse(content); // Basic JSON validation
                // Specific validations based on file type
                if (path.basename(filePath).includes('xplus1-config')) {
                    await this.validateXPlus1Config(content, result);
                }
            }
        }
        catch (error) {
            result.isValid = false;
            result.errors.push(`JSON Parse Error: ${error}`);
        }
        return result;
    }
    async validateXPlus1Config(content, result) {
        try {
            const config = JSON.parse(content);
            // Required fields validation
            const requiredFields = ['gameName', 'version', 'socketIO'];
            for (const field of requiredFields) {
                if (!(field in config)) {
                    result.warnings.push(`Missing recommended field: ${field}`);
                }
            }
            // Socket.IO configuration validation
            if (config.socketIO) {
                if (!config.socketIO.url) {
                    result.warnings.push('Socket.IO URL not configured');
                }
                if (!config.socketIO.rooms || !Array.isArray(config.socketIO.rooms)) {
                    result.warnings.push('Socket.IO rooms should be an array');
                }
            }
        }
        catch (error) {
            result.errors.push(`XPlus1 Config Validation Error: ${error}`);
            result.isValid = false;
        }
    }
    async refreshConfigFiles() {
        this.configFiles.clear();
        this.validationCache.clear();
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders)
            return;
        for (const folder of workspaceFolders) {
            await this.scanWorkspaceForConfigs(folder.uri.fsPath);
        }
    }
    async scanWorkspaceForConfigs(workspacePath) {
        const configPatterns = [
            '**/xplus1-config.json',
            '**/webrtc-ui-config.json',
            '**/socket-config.json',
            'package.json',
            'tsconfig.json'
        ];
        for (const pattern of configPatterns) {
            try {
                const files = await vscode.workspace.findFiles(new vscode.RelativePattern(workspacePath, pattern), null, 50);
                for (const file of files) {
                    await this.processConfigFile(file);
                }
            }
            catch (error) {
                console.error(`Error scanning for pattern ${pattern}:`, error);
            }
        }
    }
    refresh() {
        this.refreshConfigFiles().then(() => {
            this._onDidChangeTreeData.fire();
        });
    }
    getTreeItem(element) {
        const treeItem = new vscode.TreeItem(element.label, element.children ? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.None);
        treeItem.id = element.id;
        treeItem.description = element.description;
        treeItem.resourceUri = element.resourceUri;
        // Enhanced tooltip with validation status
        if (element.resourceUri && !element.children) {
            const validation = this.validationCache.get(element.resourceUri.fsPath);
            let tooltip = `${element.resourceUri.fsPath}\n`;
            if (validation) {
                tooltip += `Status: ${element.validationStatus}\n`;
                if (validation.errors.length > 0) {
                    tooltip += `Errors: ${validation.errors.length}\n`;
                }
                if (validation.warnings.length > 0) {
                    tooltip += `Warnings: ${validation.warnings.length}\n`;
                }
            }
            if (element.lastModified) {
                tooltip += `Modified: ${element.lastModified.toLocaleString()}`;
            }
            treeItem.tooltip = tooltip;
        }
        else {
            treeItem.tooltip = element.label;
        }
        // Icons based on config type and validation status
        if (element.children) {
            treeItem.iconPath = new vscode.ThemeIcon('folder-opened');
        }
        else {
            let iconName = 'json';
            let iconColor;
            // Validation status color coding
            switch (element.validationStatus) {
                case 'valid':
                    iconColor = 'testing.iconPassed';
                    break;
                case 'invalid':
                    iconColor = 'testing.iconFailed';
                    break;
                case 'warning':
                    iconColor = 'testing.iconSkipped';
                    break;
                default:
                    iconColor = 'testing.iconUnset';
            }
            // Config type specific icons
            switch (element.configType) {
                case 'xplus1':
                    iconName = 'game';
                    break;
                case 'socket':
                    iconName = 'radio-tower';
                    break;
                case 'ui':
                    iconName = 'browser';
                    break;
                case 'nodejs':
                    iconName = 'package';
                    break;
                case 'vscode':
                    iconName = 'code';
                    break;
            }
            treeItem.iconPath = iconColor ?
                new vscode.ThemeIcon(iconName, new vscode.ThemeColor(iconColor)) :
                new vscode.ThemeIcon(iconName);
        }
        // Context value for commands
        if (element.children) {
            treeItem.contextValue = 'configGroup';
        }
        else {
            treeItem.contextValue = `configFile-${element.configType}`;
        }
        // Make config files clickable to open in editor
        if (element.resourceUri && !element.children) {
            treeItem.command = {
                command: 'alephscript.configs.openInEditor',
                title: 'Open Configuration',
                arguments: [element.resourceUri, element.configType]
            };
        }
        return treeItem;
    }
    getChildren(element) {
        if (!element) {
            // Root level - categorize configs
            return this.getCategorizedConfigs();
        }
        // Return children for specific categories
        return Promise.resolve(element.children || []);
    }
    async getCategorizedConfigs() {
        const categories = new Map();
        categories.set('AlephScript Configs', []);
        categories.set('Development Configs', []);
        // Categorize all found config files
        for (const [filePath, configItem] of this.configFiles) {
            switch (configItem.configType) {
                case 'xplus1':
                case 'ui':
                case 'socket':
                    categories.get('AlephScript Configs')?.push(configItem);
                    break;
                case 'nodejs':
                case 'vscode':
                default:
                    categories.get('Development Configs')?.push(configItem);
            }
        }
        // Create category nodes
        const result = [];
        for (const [categoryName, configs] of categories) {
            if (configs.length > 0) {
                result.push({
                    id: `category-${categoryName.toLowerCase().replace(/\s+/g, '-')}`,
                    label: categoryName,
                    description: `${configs.length} configuration${configs.length === 1 ? '' : 's'}`,
                    children: configs.sort((a, b) => a.label.localeCompare(b.label))
                });
            }
        }
        return result;
    }
    // Public API methods for commands
    async validateConfiguration(filePath) {
        const result = await this.validateConfigFile(filePath);
        this.validationCache.set(filePath, result);
        // Show validation results
        if (result.errors.length > 0) {
            vscode.window.showErrorMessage(`Configuration validation failed: ${result.errors.join(', ')}`, 'Show Details').then(action => {
                if (action === 'Show Details') {
                    this.showValidationDetails(filePath, result);
                }
            });
        }
        else if (result.warnings.length > 0) {
            vscode.window.showWarningMessage(`Configuration has warnings: ${result.warnings.join(', ')}`, 'Show Details').then(action => {
                if (action === 'Show Details') {
                    this.showValidationDetails(filePath, result);
                }
            });
        }
        else {
            vscode.window.showInformationMessage('Configuration is valid ✓');
        }
        this.refresh();
        return result;
    }
    async reloadConfiguration(filePath) {
        try {
            await this.processConfigFile(vscode.Uri.file(filePath));
            vscode.window.showInformationMessage(`Configuration reloaded: ${path.basename(filePath)}`);
            this.refresh();
        }
        catch (error) {
            vscode.window.showErrorMessage(`Failed to reload configuration: ${error}`);
        }
    }
    async createBackup(filePath) {
        try {
            const backupPath = `${filePath}.backup.${Date.now()}`;
            await fs.promises.copyFile(filePath, backupPath);
            vscode.window.showInformationMessage(`Backup created: ${path.basename(backupPath)}`);
        }
        catch (error) {
            vscode.window.showErrorMessage(`Failed to create backup: ${error}`);
        }
    }
    async formatConfiguration(filePath) {
        try {
            if (path.extname(filePath) === '.json') {
                const content = await fs.promises.readFile(filePath, 'utf8');
                const parsed = JSON.parse(content);
                const formatted = JSON.stringify(parsed, null, 2);
                await fs.promises.writeFile(filePath, formatted, 'utf8');
                vscode.window.showInformationMessage(`Configuration formatted: ${path.basename(filePath)}`);
            }
        }
        catch (error) {
            vscode.window.showErrorMessage(`Failed to format configuration: ${error}`);
        }
    }
    async createFromTemplate(templateType) {
        const templates = {
            xplus1: {
                fileName: 'xplus1-config.json',
                content: {
                    gameName: "New AlephScript Game",
                    version: "1.0.0",
                    socketIO: {
                        url: "ws://localhost:3000",
                        rooms: ["Application", "System", "UserInterface"]
                    },
                    ui: {
                        gamification: true,
                        theme: "default"
                    },
                    mcp: {
                        enabled: true,
                        servers: []
                    }
                }
            },
            socket: {
                fileName: 'socket-config.json',
                content: {
                    url: "ws://localhost:3000",
                    rooms: {
                        "Application": { maxClients: 10 },
                        "System": { maxClients: 5 },
                        "UserInterface": { maxClients: 15 }
                    },
                    options: {
                        transports: ["websocket", "polling"]
                    }
                }
            },
            ui: {
                fileName: 'webrtc-ui-config.json',
                content: {
                    gamification: {
                        enabled: true,
                        theme: "aleph-default",
                        animations: true
                    },
                    webrtc: {
                        iceServers: [
                            { urls: "stun:stun.l.google.com:19302" }
                        ]
                    },
                    ui: {
                        layout: "grid",
                        components: ["video", "chat", "controls"]
                    }
                }
            }
        };
        const template = templates[templateType];
        if (!template)
            return;
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            vscode.window.showErrorMessage('No workspace folder open');
            return;
        }
        const filePath = path.join(workspaceFolder.uri.fsPath, template.fileName);
        const content = JSON.stringify(template.content, null, 2);
        try {
            await fs.promises.writeFile(filePath, content, 'utf8');
            const uri = vscode.Uri.file(filePath);
            await vscode.window.showTextDocument(uri);
            vscode.window.showInformationMessage(`Template created: ${template.fileName}`);
        }
        catch (error) {
            vscode.window.showErrorMessage(`Failed to create template: ${error}`);
        }
    }
    async showValidationDetails(filePath, result) {
        const document = await vscode.workspace.openTextDocument({
            content: `Configuration Validation Report: ${path.basename(filePath)}\n\n` +
                `Status: ${result.isValid ? 'VALID' : 'INVALID'}\n\n` +
                (result.errors.length > 0 ? `ERRORS:\n${result.errors.map(e => `• ${e}`).join('\n')}\n\n` : '') +
                (result.warnings.length > 0 ? `WARNINGS:\n${result.warnings.map(w => `• ${w}`).join('\n')}\n\n` : '') +
                `File: ${filePath}`,
            language: 'text'
        });
        await vscode.window.showTextDocument(document);
    }
    dispose() {
        this.fileWatchers.forEach(watcher => watcher.dispose());
        this.fileWatchers = [];
        this.configFiles.clear();
        this.validationCache.clear();
    }
}
exports.ConfigsTreeDataProvider = ConfigsTreeDataProvider;
//# sourceMappingURL=configsTreeView.js.map