import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export interface ConfigTreeItem {
    id: string;
    label: string;
    description?: string;
    resourceUri?: vscode.Uri;
    children?: ConfigTreeItem[];
    configType?: 'xplus1' | 'mcp' | 'socket' | 'ui' | 'nodejs' | 'vscode' | 'env' | 'unknown';
    validationStatus?: 'valid' | 'invalid' | 'warning' | 'unknown';
    isModified?: boolean;
    hasBackup?: boolean;
    lastModified?: Date;
}

export interface ConfigValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    schema?: any;
}

export class ConfigsTreeDataProvider implements vscode.TreeDataProvider<ConfigTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<ConfigTreeItem | undefined | null | void> = new vscode.EventEmitter<ConfigTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<ConfigTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;
    
    private fileWatchers: vscode.FileSystemWatcher[] = [];
    private configFiles: Map<string, ConfigTreeItem> = new Map();
    private validationCache: Map<string, ConfigValidationResult> = new Map();

    constructor() {
        this.setupFileWatchers();
        this.refreshConfigFiles();
    }

    private setupFileWatchers(): void {
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

    private async onConfigFileChanged(uri: vscode.Uri, changeType: 'created' | 'changed' | 'deleted'): Promise<void> {
        if (changeType === 'deleted') {
            this.configFiles.delete(uri.fsPath);
            this.validationCache.delete(uri.fsPath);
        } else {
            await this.processConfigFile(uri);
        }
        
        this.refresh();
    }

    private async processConfigFile(uri: vscode.Uri): Promise<void> {
        try {
            const fileName = path.basename(uri.fsPath);
            const stats = await fs.promises.stat(uri.fsPath);
            
            const configItem: ConfigTreeItem = {
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

        } catch (error) {
            console.error(`Error processing config file ${uri.fsPath}:`, error);
        }
    }

    private determineConfigType(fileName: string): ConfigTreeItem['configType'] {
        if (fileName.includes('xplus1-config')) return 'xplus1';
        if (fileName.includes('webrtc') || fileName.includes('ui')) return 'ui';
        if (fileName.includes('socket')) return 'socket';
        if (fileName.includes('mcp')) return 'mcp';
        if (fileName === 'package.json' || fileName === 'tsconfig.json') return 'nodejs';
        if (fileName === 'launch.json' || fileName === 'settings.json') return 'vscode';
        if (fileName.startsWith('.env')) return 'env';
        return 'unknown';
    }

    private getRelativePath(filePath: string): string {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (workspaceFolder) {
            return path.relative(workspaceFolder.uri.fsPath, filePath);
        }
        return filePath;
    }

    private async validateConfigFile(filePath: string): Promise<ConfigValidationResult> {
        const result: ConfigValidationResult = {
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
        } catch (error) {
            result.isValid = false;
            result.errors.push(`JSON Parse Error: ${error}`);
        }

        return result;
    }

    private async validateXPlus1Config(content: string, result: ConfigValidationResult): Promise<void> {
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

        } catch (error) {
            result.errors.push(`XPlus1 Config Validation Error: ${error}`);
            result.isValid = false;
        }
    }

    private async refreshConfigFiles(): Promise<void> {
        this.configFiles.clear();
        this.validationCache.clear();

        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) return;

        for (const folder of workspaceFolders) {
            await this.scanWorkspaceForConfigs(folder.uri.fsPath);
        }
    }

    private async scanWorkspaceForConfigs(workspacePath: string): Promise<void> {
        const configPatterns = [
            '**/xplus1-config.json',
            '**/webrtc-ui-config.json',
            '**/socket-config.json',
            'package.json',
            'tsconfig.json'
        ];

        for (const pattern of configPatterns) {
            try {
                const files = await vscode.workspace.findFiles(
                    new vscode.RelativePattern(workspacePath, pattern),
                    null,
                    50
                );

                for (const file of files) {
                    await this.processConfigFile(file);
                }
            } catch (error) {
                console.error(`Error scanning for pattern ${pattern}:`, error);
            }
        }
    }

    refresh(): void {
        this.refreshConfigFiles().then(() => {
            this._onDidChangeTreeData.fire();
        });
    }

    getTreeItem(element: ConfigTreeItem): vscode.TreeItem {
        const treeItem = new vscode.TreeItem(
            element.label,
            element.children ? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.None
        );
        
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
        } else {
            treeItem.tooltip = element.label;
        }
        
        // Icons based on config type and validation status
        if (element.children) {
            treeItem.iconPath = new vscode.ThemeIcon('folder-opened');
        } else {
            let iconName = 'json';
            let iconColor: string | undefined;
            
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
        } else {
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

    getChildren(element?: ConfigTreeItem): Thenable<ConfigTreeItem[]> {
        if (!element) {
            // Root level - categorize configs
            return this.getCategorizedConfigs();
        }

        // Return children for specific categories
        return Promise.resolve(element.children || []);
    }

    private async getCategorizedConfigs(): Promise<ConfigTreeItem[]> {
        const categories: Map<string, ConfigTreeItem[]> = new Map();
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
        const result: ConfigTreeItem[] = [];
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
    public async validateConfiguration(filePath: string): Promise<ConfigValidationResult> {
        const result = await this.validateConfigFile(filePath);
        this.validationCache.set(filePath, result);
        
        // Show validation results
        if (result.errors.length > 0) {
            vscode.window.showErrorMessage(
                `Configuration validation failed: ${result.errors.join(', ')}`,
                'Show Details'
            ).then(action => {
                if (action === 'Show Details') {
                    this.showValidationDetails(filePath, result);
                }
            });
        } else if (result.warnings.length > 0) {
            vscode.window.showWarningMessage(
                `Configuration has warnings: ${result.warnings.join(', ')}`,
                'Show Details'
            ).then(action => {
                if (action === 'Show Details') {
                    this.showValidationDetails(filePath, result);
                }
            });
        } else {
            vscode.window.showInformationMessage('Configuration is valid ✓');
        }
        
        this.refresh();
        return result;
    }

    public async reloadConfiguration(filePath: string): Promise<void> {
        try {
            await this.processConfigFile(vscode.Uri.file(filePath));
            vscode.window.showInformationMessage(`Configuration reloaded: ${path.basename(filePath)}`);
            this.refresh();
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to reload configuration: ${error}`);
        }
    }

    public async createBackup(filePath: string): Promise<void> {
        try {
            const backupPath = `${filePath}.backup.${Date.now()}`;
            await fs.promises.copyFile(filePath, backupPath);
            vscode.window.showInformationMessage(`Backup created: ${path.basename(backupPath)}`);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to create backup: ${error}`);
        }
    }

    public async formatConfiguration(filePath: string): Promise<void> {
        try {
            if (path.extname(filePath) === '.json') {
                const content = await fs.promises.readFile(filePath, 'utf8');
                const parsed = JSON.parse(content);
                const formatted = JSON.stringify(parsed, null, 2);
                await fs.promises.writeFile(filePath, formatted, 'utf8');
                vscode.window.showInformationMessage(`Configuration formatted: ${path.basename(filePath)}`);
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to format configuration: ${error}`);
        }
    }

    public async createFromTemplate(templateType: 'xplus1' | 'socket' | 'ui'): Promise<void> {
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
        if (!template) return;

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
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to create template: ${error}`);
        }
    }

    private async showValidationDetails(filePath: string, result: ConfigValidationResult): Promise<void> {
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

    public dispose(): void {
        this.fileWatchers.forEach(watcher => watcher.dispose());
        this.fileWatchers = [];
        this.configFiles.clear();
        this.validationCache.clear();
    }
}
