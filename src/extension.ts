import * as vscode from 'vscode';
import { ExtensionBootstrap } from './core/extensionBootstrap';

// Global extension bootstrap instance
let extensionBootstrap: ExtensionBootstrap | undefined;

/**
 * VS Code extension activation function
 */
export async function activate(context: vscode.ExtensionContext): Promise<void> {
    console.log('AlephScript Extension is activating...');
    
    try {
        // Initialize extension bootstrap using getInstance
        extensionBootstrap = ExtensionBootstrap.getInstance();
        
        // Initialize with VS Code context
        await extensionBootstrap.initialize(context);
        
        console.log('AlephScript Extension activated successfully!');
        
    } catch (error) {
        console.error('Failed to activate AlephScript Extension:', error);
        vscode.window.showErrorMessage(`Failed to activate AlephScript Extension: ${error}`);
        throw error;
    }
}

/**
 * VS Code extension deactivation function
 */
export async function deactivate(): Promise<void> {
    console.log('AlephScript Extension is deactivating...');
    
    try {
        if (extensionBootstrap) {
            await extensionBootstrap.dispose();
            extensionBootstrap = undefined;
        }
        
        console.log('AlephScript Extension deactivated successfully!');
        
    } catch (error) {
        console.error('Error during extension deactivation:', error);
        throw error;
    }
}
