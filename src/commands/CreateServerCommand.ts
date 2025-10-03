import * as vscode from 'vscode';
import { ConfigurationManager } from '../config/ConfigurationManager';

export class CreateServerCommand {
  public static readonly commandName = 'mcp-server-builder.createServer';
  
  public static register(context: vscode.ExtensionContext): vscode.Disposable {
    const command = vscode.commands.registerCommand(this.commandName, () => {
      return this.execute();
    });
    
    context.subscriptions.push(command);
    return command;
  }
  
  private static async execute(): Promise<void> {
    try {
      // Ensure API key is configured
      const apiKey = await ConfigurationManager.ensureApiKey();
      if (!apiKey) {
        vscode.window.showErrorMessage('OpenAI API key is required to generate MCP servers.');
        return;
      }
      
      // Show a simple input for now (will be replaced with a full UI later)
      const description = await vscode.window.showInputBox({
        prompt: 'Describe the MCP server you want to create',
        placeHolder: 'e.g., A server that provides weather information for any location',
        ignoreFocusOut: true
      });
      
      if (!description) {
        return;
      }
      
      // Show language selection
      const language = await vscode.window.showQuickPick([
        { label: 'TypeScript', description: 'Generate TypeScript MCP server' },
        { label: 'JavaScript', description: 'Generate JavaScript MCP server' },
        { label: 'Python', description: 'Generate Python MCP server' }
      ], {
        placeHolder: 'Select programming language'
      });
      
      if (!language) {
        return;
      }
      
      // Show transport selection
      const transport = await vscode.window.showQuickPick([
        { label: 'stdio', description: 'Standard input/output transport' },
        { label: 'sse', description: 'Server-Sent Events transport' }
      ], {
        placeHolder: 'Select transport type'
      });
      
      if (!transport) {
        return;
      }
      
      // Show progress notification
      await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'Generating MCP Server',
        cancellable: false
      }, async (progress) => {
        progress.report({ increment: 0, message: 'Initializing...' });
        
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 1000));
        progress.report({ increment: 30, message: 'Analyzing requirements...' });
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        progress.report({ increment: 60, message: 'Generating code...' });
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        progress.report({ increment: 90, message: 'Finalizing...' });
        
        await new Promise(resolve => setTimeout(resolve, 500));
        progress.report({ increment: 100, message: 'Complete!' });
      });
      
      // Show success message
      vscode.window.showInformationMessage(
        `MCP server created successfully!\nLanguage: ${language.label}\nTransport: ${transport.label}`,
        'View Files'
      ).then(selection => {
        if (selection === 'View Files') {
          // This will be implemented later to show the generated files
          vscode.window.showInformationMessage('File viewing will be implemented in the next phase.');
        }
      });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      vscode.window.showErrorMessage(`Failed to create MCP server: ${errorMessage}`);
    }
  }
}