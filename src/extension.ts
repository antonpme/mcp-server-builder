import * as vscode from 'vscode';
import { CreateServerCommand } from './commands/CreateServerCommand';
import { OpenWebviewCommand } from './commands/OpenWebviewCommand';
import { ConfigurationManager } from './config/ConfigurationManager';

export function activate(context: vscode.ExtensionContext) {
  console.log('MCP Server Builder extension is now active!');

  ConfigurationManager.initialize(context);

  // Register commands
  CreateServerCommand.register(context);
  OpenWebviewCommand.register(context);

  // Show welcome message on first activation
  const showWelcomeMessage = context.globalState.get<boolean>('mcp-server-builder.welcomeShown', false);
  if (!showWelcomeMessage) {
    vscode.window.showInformationMessage(
      'Welcome to MCP Server Builder! Get started by running the "Create MCP Server" command.',
      'Open Builder',
      'Configure API Key'
    ).then((selection) => {
      if (selection === 'Open Builder') {
        vscode.commands.executeCommand(OpenWebviewCommand.commandName);
      } else if (selection === 'Configure API Key') {
        ConfigurationManager.promptForApiKey();
      }
    });

    context.globalState.update('mcp-server-builder.welcomeShown', true);
  }
}

export function deactivate() {
  console.log('MCP Server Builder extension is now deactivated');
}
