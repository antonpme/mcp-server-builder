import * as vscode from 'vscode';

export class ConfigurationManager {
  private static readonly CONFIG_SECTION = 'mcpServerBuilder';
  private static readonly DEFAULT_API_KEY = ''; // Replace with your own API key or configure in VSCode settings
  
  static getOpenAIApiKey(): string {
    const config = vscode.workspace.getConfiguration(this.CONFIG_SECTION);
    return config.get<string>('openaiApiKey', '');
  }
  
  static async setOpenAIApiKey(apiKey: string): Promise<void> {
    const config = vscode.workspace.getConfiguration(this.CONFIG_SECTION);
    await config.update('openaiApiKey', apiKey, vscode.ConfigurationTarget.Global);
  }
  
  static getDefaultLanguage(): string {
    const config = vscode.workspace.getConfiguration(this.CONFIG_SECTION);
    return config.get<string>('defaultLanguage', 'typescript');
  }
  
  static async setDefaultLanguage(language: string): Promise<void> {
    const config = vscode.workspace.getConfiguration(this.CONFIG_SECTION);
    await config.update('defaultLanguage', language, vscode.ConfigurationTarget.Global);
  }
  
  static getDefaultTransport(): string {
    const config = vscode.workspace.getConfiguration(this.CONFIG_SECTION);
    return config.get<string>('defaultTransport', 'stdio');
  }
  
  static async setDefaultTransport(transport: string): Promise<void> {
    const config = vscode.workspace.getConfiguration(this.CONFIG_SECTION);
    await config.update('defaultTransport', transport, vscode.ConfigurationTarget.Global);
  }
  
  static async promptForApiKey(): Promise<string | undefined> {
    const apiKey = await vscode.window.showInputBox({
      prompt: 'Enter your OpenAI API key',
      password: true,
      ignoreFocusOut: true,
      placeHolder: 'sk-...'
    });
    
    if (apiKey) {
      await this.setOpenAIApiKey(apiKey);
    }
    
    return apiKey;
  }
  
  static async ensureApiKey(): Promise<string | undefined> {
    let apiKey = this.getOpenAIApiKey();
    
    if (!apiKey) {
      const result = await vscode.window.showInformationMessage(
        'OpenAI API key is required to generate MCP servers. Would you like to set it now?',
        'Set API Key', 'Cancel'
      );
      
      if (result === 'Set API Key') {
        const newApiKey = await this.promptForApiKey();
        if (newApiKey) {
          apiKey = newApiKey;
        }
      }
    }
    
    return apiKey;
  }
}