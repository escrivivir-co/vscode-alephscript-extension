import * as vscode from 'vscode';
import { UIManager, UIInstance } from '../uiManager';

export interface UITreeItem {
    id: string;
    label: string;
    description?: string;
    status: 'running' | 'stopped' | 'error';
    type: string;
    port?: number;
    enabled: boolean;
    children?: UITreeItem[];
}

export class UIsTreeDataProvider implements vscode.TreeDataProvider<UITreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<UITreeItem | undefined | null | void> = new vscode.EventEmitter<UITreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<UITreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor(private uiManager: UIManager) {}

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: UITreeItem): vscode.TreeItem {
        const treeItem = new vscode.TreeItem(element.label, element.children ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None);
        
        treeItem.id = element.id;
        treeItem.description = element.description;
        treeItem.tooltip = `${element.label} (${element.type}) - ${element.status}${element.port ? ` - port ${element.port}` : ''}`;
        
        // Status and type-based icons
        if (element.children) {
            treeItem.iconPath = new vscode.ThemeIcon('folder');
        } else {
            // UI type icons
            switch (element.type) {
                case 'console':
                    treeItem.iconPath = new vscode.ThemeIcon('terminal');
                    break;
                case 'html5':
                case 'threejs':
                    treeItem.iconPath = new vscode.ThemeIcon('browser');
                    break;
                case 'unity':
                    treeItem.iconPath = new vscode.ThemeIcon('game');
                    break;
                case 'webrtc':
                    treeItem.iconPath = new vscode.ThemeIcon('broadcast');
                    break;
                case 'blockly-gamify-ui':
                case 'node-red-gamify-ui':
                    treeItem.iconPath = new vscode.ThemeIcon('extensions');
                    break;
                default:
                    treeItem.iconPath = new vscode.ThemeIcon('window');
            }
        }

        // Status color modifier
        if (!element.children) {
            const statusColor = element.status === 'running' ? 'testing.iconPassed' : 
                               element.status === 'error' ? 'testing.iconFailed' : 
                               'testing.iconQueued';
            
            if (treeItem.iconPath instanceof vscode.ThemeIcon) {
                treeItem.iconPath = new vscode.ThemeIcon(treeItem.iconPath.id, new vscode.ThemeColor(statusColor));
            }
        }

        // Context value for commands
        treeItem.contextValue = element.children ? 'uiGroup' : element.enabled ? 'uiEnabled' : 'uiDisabled';
        
        return treeItem;
    }

    getChildren(element?: UITreeItem): Thenable<UITreeItem[]> {
        if (!element) {
            // Root level - show UI categories
            return Promise.resolve([
                {
                    id: 'gamification-uis',
                    label: 'Gamification UIs',
                    description: 'Interactive game interfaces',
                    status: 'stopped',
                    type: 'group',
                    enabled: true,
                    children: []
                },
                {
                    id: 'system-uis',
                    label: 'System UIs',
                    description: 'Management and monitoring',
                    status: 'stopped', 
                    type: 'group',
                    enabled: true,
                    children: []
                }
            ]);
        }

        if (element.id === 'gamification-uis') {
            return this.getGamificationUIs();
        }

        if (element.id === 'system-uis') {
            return this.getSystemUIs();
        }

        return Promise.resolve([]);
    }

    private async getGamificationUIs(): Promise<UITreeItem[]> {
        // Mock data based on typical AlephScript UI types
        const gamificationUIs: UITreeItem[] = [
            {
                id: 'threejs-gamify-ui',
                label: 'Three.js Gamify UI',
                description: '3D game interface',
                status: 'stopped',
                type: 'threejs',
                port: 8080,
                enabled: true
            },
            {
                id: 'unity-gamify-ui',
                label: 'Unity Gamify UI',
                description: 'Unity-based game client',
                status: 'stopped',
                type: 'unity',
                enabled: true
            },
            {
                id: 'webrtc-gamify-ui',
                label: 'WebRTC Gamify UI',
                description: 'Real-time communication UI',
                status: 'stopped',
                type: 'webrtc',
                port: 8082,
                enabled: true
            }
        ];

        return gamificationUIs;
    }

    private async getSystemUIs(): Promise<UITreeItem[]> {
        const systemUIs: UITreeItem[] = [
            {
                id: 'blockly-gamify-ui',
                label: 'Blockly IDE',
                description: 'Visual programming interface',
                status: 'stopped',
                type: 'blockly-gamify-ui',
                port: 9094,
                enabled: true
            },
            {
                id: 'node-red-gamify-ui',
                label: 'Node-RED Gamify',
                description: 'Flow-based programming',
                status: 'stopped',
                type: 'node-red-gamify-ui',
                port: 1880,
                enabled: true
            }
        ];

        return systemUIs;
    }
}
