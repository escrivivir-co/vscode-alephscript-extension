import * as vscode from 'vscode';
import { LoggingManager, LogLevel, LogCategory, LogEntry } from '../loggingManager';

interface LogTreeItem {
    type: 'category' | 'entry' | 'filter';
    category?: LogCategory;
    entry?: LogEntry;
    label: string;
    description?: string;
    children?: LogTreeItem[];
}

export class LogsTreeDataProvider implements vscode.TreeDataProvider<LogTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<LogTreeItem | undefined | null | void> = new vscode.EventEmitter<LogTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<LogTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private loggingManager: LoggingManager;
    private refreshTimer: NodeJS.Timeout | undefined;
    private autoRefresh: boolean = true;
    private groupByCategory: boolean = true;
    private showOnlyErrors: boolean = false;
    private selectedCategories: Set<LogCategory> = new Set(Object.values(LogCategory));
    private maxDisplayEntries: number = 1000;

    constructor() {
        this.loggingManager = LoggingManager.getInstance();
        
        // Auto-refresh every 2 seconds if enabled
        this.startAutoRefresh();
    }

    private startAutoRefresh(): void {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
        }
        
        if (this.autoRefresh) {
            this.refreshTimer = setInterval(() => {
                this._onDidChangeTreeData.fire();
            }, 2000);
        }
    }

    getTreeItem(element: LogTreeItem): vscode.TreeItem {
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
                treeItem.tooltip = this.createLogTooltip(element.entry!);
                treeItem.iconPath = this.getLogLevelIcon(element.entry!.level);
                
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

    getChildren(element?: LogTreeItem): Thenable<LogTreeItem[]> {
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

    private getRootItems(): LogTreeItem[] {
        const items: LogTreeItem[] = [];
        
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
            
            for (const category of Object.values(LogCategory)) {
                if (!this.selectedCategories.has(category)) continue;
                
                const count = stats.categoryBreakdown[category] || 0;
                if (count === 0) continue;
                
                items.push({
                    type: 'category',
                    category: category,
                    label: this.formatCategoryName(category),
                    description: `${count} entries`
                });
            }
        } else {
            // Show all entries chronologically
            const entries = this.getFilteredEntries();
            items.push(...entries.slice(-this.maxDisplayEntries).reverse().map(entry => this.createEntryItem(entry)));
        }
        
        return items;
    }

    private getCategoryEntries(category: LogCategory): LogTreeItem[] {
        const entries = this.loggingManager.getLogEntries(category);
        const filteredEntries = entries.filter(entry => {
            if (this.showOnlyErrors && entry.level > LogLevel.ERROR) return false;
            return true;
        });
        
        return filteredEntries
            .slice(-this.maxDisplayEntries)
            .reverse()
            .map(entry => this.createEntryItem(entry));
    }

    private createEntryItem(entry: LogEntry): LogTreeItem {
        const timestamp = new Date(entry.timestamp).toLocaleTimeString();
        const levelName = LogLevel[entry.level];
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

    private getFilteredEntries(): LogEntry[] {
        const allEntries = this.loggingManager.getLogEntries();
        return allEntries.filter(entry => {
            if (!this.selectedCategories.has(entry.category)) return false;
            if (this.showOnlyErrors && entry.level > LogLevel.ERROR) return false;
            return true;
        });
    }

    private getFilterDescription(): string {
        const parts: string[] = [];
        
        if (this.showOnlyErrors) {
            parts.push('Errors only');
        }
        
        if (this.selectedCategories.size < Object.values(LogCategory).length) {
            parts.push(`${this.selectedCategories.size}/${Object.values(LogCategory).length} categories`);
        }
        
        return parts.length > 0 ? parts.join(', ') : 'No filters';
    }

    private formatCategoryName(category: LogCategory): string {
        return category.charAt(0).toUpperCase() + category.slice(1);
    }

    private getLogLevelIcon(level: LogLevel): vscode.ThemeIcon {
        switch (level) {
            case LogLevel.ERROR:
                return new vscode.ThemeIcon('error', new vscode.ThemeColor('errorForeground'));
            case LogLevel.WARN:
                return new vscode.ThemeIcon('warning', new vscode.ThemeColor('warningForeground'));
            case LogLevel.INFO:
                return new vscode.ThemeIcon('info', new vscode.ThemeColor('notificationsInfoIcon.foreground'));
            case LogLevel.DEBUG:
                return new vscode.ThemeIcon('bug');
            case LogLevel.TRACE:
                return new vscode.ThemeIcon('search');
            default:
                return new vscode.ThemeIcon('circle-filled');
        }
    }

    private createLogTooltip(entry: LogEntry): string {
        const parts = [
            `Time: ${new Date(entry.timestamp).toLocaleString()}`,
            `Level: ${LogLevel[entry.level]}`,
            `Category: ${entry.category}`,
            entry.source ? `Source: ${entry.source}` : null,
            `Message: ${entry.message}`,
            entry.data ? `Data: ${JSON.stringify(entry.data, null, 2)}` : null
        ].filter(Boolean);
        
        return parts.join('\n');
    }

    // Public methods for UI commands
    public toggleAutoRefresh(): void {
        this.autoRefresh = !this.autoRefresh;
        if (this.autoRefresh) {
            this.startAutoRefresh();
        } else if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
            this.refreshTimer = undefined;
        }
        this._onDidChangeTreeData.fire();
    }

    public toggleGroupByCategory(): void {
        this.groupByCategory = !this.groupByCategory;
        this._onDidChangeTreeData.fire();
    }

    public toggleErrorsOnly(): void {
        this.showOnlyErrors = !this.showOnlyErrors;
        this._onDidChangeTreeData.fire();
    }

    public setCategoryFilter(categories: LogCategory[]): void {
        this.selectedCategories = new Set(categories);
        this._onDidChangeTreeData.fire();
    }

    public toggleCategory(category: LogCategory): void {
        if (this.selectedCategories.has(category)) {
            this.selectedCategories.delete(category);
        } else {
            this.selectedCategories.add(category);
        }
        this._onDidChangeTreeData.fire();
    }

    public clearLogs(): void {
        this.loggingManager.clearAllChannels();
        this._onDidChangeTreeData.fire();
    }

    public exportLogs(): void {
        this.loggingManager.exportLogs();
    }

    public refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    public showLogEntry(entry: LogEntry): void {
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

    private formatFullLogEntry(entry: LogEntry): string {
        const formatted = {
            timestamp: entry.timestamp,
            level: LogLevel[entry.level],
            category: entry.category,
            source: entry.source,
            message: entry.message,
            data: entry.data
        };
        
        return JSON.stringify(formatted, null, 2);
    }

    public getAutoRefreshStatus(): boolean {
        return this.autoRefresh;
    }

    public getGroupByCategoryStatus(): boolean {
        return this.groupByCategory;
    }

    public getErrorsOnlyStatus(): boolean {
        return this.showOnlyErrors;
    }

    public dispose(): void {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
        }
    }
}
