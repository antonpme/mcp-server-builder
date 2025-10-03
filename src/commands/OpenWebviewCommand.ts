import * as vscode from 'vscode';
import { WebviewPanel } from '../ui/WebviewPanel';

export class OpenWebviewCommand {
  public static readonly commandName = 'mcp-server-builder.openWebview';
  
  public static register(context: vscode.ExtensionContext): vscode.Disposable {
    const command = vscode.commands.registerCommand(this.commandName, () => {
      return this.execute(context.extensionUri);
    });
    
    context.subscriptions.push(command);
    return command;
  }
  
  private static async execute(extensionUri: vscode.Uri): Promise<void> {
    try {
      WebviewPanel.createOrShow(extensionUri);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      vscode.window.showErrorMessage(`Failed to open webview: ${errorMessage}`);
    }
  }
}