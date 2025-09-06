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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const extensionBootstrap_1 = require("./core/extensionBootstrap");
// Global extension bootstrap instance
let extensionBootstrap;
/**
 * VS Code extension activation function
 */
async function activate(context) {
    console.log('AlephScript Extension is activating...');
    try {
        // Initialize extension bootstrap using getInstance
        extensionBootstrap = extensionBootstrap_1.ExtensionBootstrap.getInstance();
        // Initialize with VS Code context
        await extensionBootstrap.initialize(context);
        console.log('AlephScript Extension activated successfully!');
    }
    catch (error) {
        console.error('Failed to activate AlephScript Extension:', error);
        vscode.window.showErrorMessage(`Failed to activate AlephScript Extension: ${error}`);
        throw error;
    }
}
/**
 * VS Code extension deactivation function
 */
async function deactivate() {
    console.log('AlephScript Extension is deactivating...');
    try {
        if (extensionBootstrap) {
            await extensionBootstrap.dispose();
            extensionBootstrap = undefined;
        }
        console.log('AlephScript Extension deactivated successfully!');
    }
    catch (error) {
        console.error('Error during extension deactivation:', error);
        throw error;
    }
}
//# sourceMappingURL=extension.js.map