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
exports.LogsTreeDataProvider = void 0;
const vscode = __importStar(require("vscode"));
const loggingManager_1 = require("../loggingManager");
class LogsTreeDataProvider {
    constructor() {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.autoRefresh = true;
        this.groupByCategory = true;
        this.showOnlyErrors = false;
        this.selectedCategories = new Set(Object.values(loggingManager_1.LogCategory));
        this.maxDisplayEntries = 1000;
        this.loggingManager = loggingManager_1.LoggingManager.getInstance();
        // Auto-refresh every 2 seconds if enabled
        this.startAutoRefresh();
    }
    startAutoRefresh() {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
        }
        if (this.autoRefresh) {
            this.refreshTimer = setInterval(() => {
                this._onDidChangeTreeData.fire();
            }, 2000);
        }
    }
    getTreeItem(element) {
        const treeItem = new vscode.TreeItem(element.label);
        switch (element.type) {
            case 'category':
                treeItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
                treeItem.contextValue = 'logCategory';
                treeItem.description = element.description;
                treeItem.iconPath = new vscode.ThemeIcon('folder');
                break;
            case 'entry':
                treeItem.collapsibleState = vscode.TreeItemCollapsibleState.None;
                treeItem.contextValue = 'logEntry';
                treeItem.description = element.description;
                treeItem.tooltip = this.createLogTooltip(element.entry);
                treeItem.iconPath = this.getLogLevelIcon(element.entry.level);
                // Command to show full log entry
                treeItem.command = {
                    command: 'alephscript.logs.showEntry',
                    title: 'Show Log Entry',
                    arguments: [element.entry]
                };
                break;
            case 'filter':
                treeItem.collapsibleState = vscode.TreeItemCollapsibleState.None;
                treeItem.contextValue = 'logFilter';
                treeItem.description = element.description;
                treeItem.iconPath = new vscode.ThemeIcon('filter');
                break;
        }
        return treeItem;
    }
    getChildren(element) {
        if (!element) {
            // Root level - show filters and categories
            return Promise.resolve(this.getRootItems());
        }
        if (element.type === 'category' && element.category) {
            // Show log entries for this category
            return Promise.resolve(this.getCategoryEntries(element.category));
        }
        return Promise.resolve([]);
    }
    getRootItems() {
        const items = [];
        // Add filter status
        items.push({
            type: 'filter',
            label: 'Filters',
            description: this.getFilterDescription(),
            children: []
        });
        if (this.groupByCategory) {
            // Group by category
            const stats = this.loggingManager.getLogStats();
            for (const category of Object.values(loggingManager_1.LogCategory)) {
                if (!this.selectedCategories.has(category))
                    continue;
                const count = stats.categoryBreakdown[category] || 0;
                if (count === 0)
                    continue;
                items.push({
                    type: 'category',
                    category: category,
                    label: this.formatCategoryName(category),
                    description: `${count} entries`
                });
            }
        }
        else {
            // Show all entries chronologically
            const entries = this.getFilteredEntries();
            items.push(...entries.slice(-this.maxDisplayEntries).reverse().map(entry => this.createEntryItem(entry)));
        }
        return items;
    }
    getCategoryEntries(category) {
        const entries = this.loggingManager.getLogEntries(category);
        const filteredEntries = entries.filter(entry => {
            if (this.showOnlyErrors && entry.level > loggingManager_1.LogLevel.ERROR)
                return false;
            return true;
        });
        return filteredEntries
            .slice(-this.maxDisplayEntries)
            .reverse()
            .map(entry => this.createEntryItem(entry));
    }
    createEntryItem(entry) {
        const timestamp = new Date(entry.timestamp).toLocaleTimeString();
        const levelName = loggingManager_1.LogLevel[entry.level];
        const truncatedMessage = entry.message.length > 60
            ? entry.message.substring(0, 57) + '...'
            : entry.message;
        return {
            type: 'entry',
            entry: entry,
            label: `${timestamp} - ${truncatedMessage}`,
            description: `${levelName}${entry.source ? ` (${entry.source})` : ''}`
        };
    }
    getFilteredEntries() {
        const allEntries = this.loggingManager.getLogEntries();
        return allEntries.filter(entry => {
            if (!this.selectedCategories.has(entry.category))
                return false;
            if (this.showOnlyErrors && entry.level > loggingManager_1.LogLevel.ERROR)
                return false;
            return true;
        });
    }
    getFilterDescription() {
        const parts = [];
        if (this.showOnlyErrors) {
            parts.push('Errors only');
        }
        if (this.selectedCategories.size < Object.values(loggingManager_1.LogCategory).length) {
            parts.push(`${this.selectedCategories.size}/${Object.values(loggingManager_1.LogCategory).length} categories`);
        }
        return parts.length > 0 ? parts.join(', ') : 'No filters';
    }
    formatCategoryName(category) {
        return category.charAt(0).toUpperCase() + category.slice(1);
    }
    getLogLevelIcon(level) {
        switch (level) {
            case loggingManager_1.LogLevel.ERROR:
                return new vscode.ThemeIcon('error', new vscode.ThemeColor('errorForeground'));
            case loggingManager_1.LogLevel.WARN:
                return new vscode.ThemeIcon('warning', new vscode.ThemeColor('warningForeground'));
            case loggingManager_1.LogLevel.INFO:
                return new vscode.ThemeIcon('info', new vscode.ThemeColor('notificationsInfoIcon.foreground'));
            case loggingManager_1.LogLevel.DEBUG:
                return new vscode.ThemeIcon('bug');
            case loggingManager_1.LogLevel.TRACE:
                return new vscode.ThemeIcon('search');
            default:
                return new vscode.ThemeIcon('circle-filled');
        }
    }
    createLogTooltip(entry) {
        const parts = [
            `Time: ${new Date(entry.timestamp).toLocaleString()}`,
            `Level: ${loggingManager_1.LogLevel[entry.level]}`,
            `Category: ${entry.category}`,
            entry.source ? `Source: ${entry.source}` : null,
            `Message: ${entry.message}`,
            entry.data ? `Data: ${JSON.stringify(entry.data, null, 2)}` : null
        ].filter(Boolean);
        return parts.join('\n');
    }
    // Public methods for UI commands
    toggleAutoRefresh() {
        this.autoRefresh = !this.autoRefresh;
        if (this.autoRefresh) {
            this.startAutoRefresh();
        }
        else if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
            this.refreshTimer = undefined;
        }
        this._onDidChangeTreeData.fire();
    }
    toggleGroupByCategory() {
        this.groupByCategory = !this.groupByCategory;
        this._onDidChangeTreeData.fire();
    }
    toggleErrorsOnly() {
        this.showOnlyErrors = !this.showOnlyErrors;
        this._onDidChangeTreeData.fire();
    }
    setCategoryFilter(categories) {
        this.selectedCategories = new Set(categories);
        this._onDidChangeTreeData.fire();
    }
    toggleCategory(category) {
        if (this.selectedCategories.has(category)) {
            this.selectedCategories.delete(category);
        }
        else {
            this.selectedCategories.add(category);
        }
        this._onDidChangeTreeData.fire();
    }
    clearLogs() {
        this.loggingManager.clearAllChannels();
        this._onDidChangeTreeData.fire();
    }
    exportLogs() {
        this.loggingManager.exportLogs();
    }
    refresh() {
        this._onDidChangeTreeData.fire();
    }
    showLogEntry(entry) {
        // Create a temporary document to show the full log entry
        const content = this.formatFullLogEntry(entry);
        vscode.workspace.openTextDocument({
            content: content,
            language: 'json'
        }).then(document => {
            vscode.window.showTextDocument(document, {
                preview: true,
                viewColumn: vscode.ViewColumn.Beside
            });
        });
    }
    formatFullLogEntry(entry) {
        const formatted = {
            timestamp: entry.timestamp,
            level: loggingManager_1.LogLevel[entry.level],
            category: entry.category,
            source: entry.source,
            message: entry.message,
            data: entry.data
        };
        return JSON.stringify(formatted, null, 2);
    }
    getAutoRefreshStatus() {
        return this.autoRefresh;
    }
    getGroupByCategoryStatus() {
        return this.groupByCategory;
    }
    getErrorsOnlyStatus() {
        return this.showOnlyErrors;
    }
    dispose() {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
        }
    }
}
exports.LogsTreeDataProvider = LogsTreeDataProvider;
//# sourceMappingURL=logsTreeView.js.map