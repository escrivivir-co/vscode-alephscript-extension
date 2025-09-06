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
exports.UIsTreeDataProvider = void 0;
const vscode = __importStar(require("vscode"));
class UIsTreeDataProvider {
    constructor(uiManager) {
        this.uiManager = uiManager;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    }
    refresh() {
        this._onDidChangeTreeData.fire();
    }
    getTreeItem(element) {
        const treeItem = new vscode.TreeItem(element.label, element.children ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None);
        treeItem.id = element.id;
        treeItem.description = element.description;
        treeItem.tooltip = `${element.label} (${element.type}) - ${element.status}${element.port ? ` - port ${element.port}` : ''}`;
        // Status and type-based icons
        if (element.children) {
            treeItem.iconPath = new vscode.ThemeIcon('folder');
        }
        else {
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
    getChildren(element) {
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
    async getGamificationUIs() {
        // Mock data based on typical AlephScript UI types
        const gamificationUIs = [
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
    async getSystemUIs() {
        const systemUIs = [
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
exports.UIsTreeDataProvider = UIsTreeDataProvider;
//# sourceMappingURL=uisTreeView.js.map