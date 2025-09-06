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
exports.AgentsTreeDataProvider = void 0;
const vscode = __importStar(require("vscode"));
class AgentsTreeDataProvider {
    constructor(mcpServerManager) {
        this.mcpServerManager = mcpServerManager;
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
        treeItem.tooltip = `${element.label} - ${element.status}${element.port ? ` (port ${element.port})` : ''}`;
        // Status-based icons
        switch (element.status) {
            case 'running':
                treeItem.iconPath = new vscode.ThemeIcon('play', new vscode.ThemeColor('testing.iconPassed'));
                break;
            case 'stopped':
                treeItem.iconPath = new vscode.ThemeIcon('stop', new vscode.ThemeColor('testing.iconQueued'));
                break;
            case 'error':
                treeItem.iconPath = new vscode.ThemeIcon('error', new vscode.ThemeColor('testing.iconFailed'));
                break;
        }
        // Context value for commands
        treeItem.contextValue = element.children ? 'agentGroup' : 'agent';
        return treeItem;
    }
    getChildren(element) {
        if (!element) {
            // Root level - show MCP Servers group
            return Promise.resolve([
                {
                    id: 'mcp-servers',
                    label: 'MCP Servers',
                    description: 'Model Context Protocol Servers',
                    status: 'running',
                    children: []
                }
            ]);
        }
        if (element.id === 'mcp-servers') {
            return this.getMCPServers();
        }
        return Promise.resolve([]);
    }
    async getMCPServers() {
        try {
            // Access servers from MCPServerManager (need to make this public or add getter)
            const servers = [
                {
                    id: 'state-machine-server',
                    label: 'State Machine Server',
                    description: 'Game state management',
                    status: 'stopped', // Will be updated from actual status
                    port: 3001
                },
                {
                    id: 'wiki-mcp-browser',
                    label: 'Wiki MCP Browser',
                    description: 'Knowledge browsing',
                    status: 'stopped',
                    port: 3002
                },
                {
                    id: 'devops-mcp-server',
                    label: 'DevOps MCP Server',
                    description: 'System operations',
                    status: 'stopped',
                    port: 3003
                }
            ];
            return servers;
        }
        catch (error) {
            console.error('Error loading MCP servers for TreeView:', error);
            return [];
        }
    }
}
exports.AgentsTreeDataProvider = AgentsTreeDataProvider;
//# sourceMappingURL=agentsTreeView.js.map