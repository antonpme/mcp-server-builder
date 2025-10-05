import * as vscode from 'vscode';

export class ConfigurationManager {
  private static readonly CONFIG_SECTION = 'mcpServerBuilder';
  private static readonly SECRET_KEY = 'mcpServerBuilder.openaiApiKey';
  private static context: vscode.ExtensionContext | undefined;

  static initialize(context: vscode.ExtensionContext): void {
    this.context = context;
  }

  private static get secretStorage(): vscode.SecretStorage {
    if (!this.context) {
      throw new Error('ConfigurationManager has not been initialized. Call initialize(context) during activation.');
    }

    return this.context.secrets;
  }

  static async getOpenAIApiKey(): Promise<string> {
    const secret = await this.secretStorage.get(this.SECRET_KEY);
    if (secret && secret.trim().length > 0) {
      return secret;
    }

    const config = vscode.workspace.getConfiguration(this.CONFIG_SECTION);
    const legacyValue = (config.get<string>('openaiApiKey') || '').trim();

    if (legacyValue) {
      await this.secretStorage.store(this.SECRET_KEY, legacyValue);
      await config.update('openaiApiKey', '', vscode.ConfigurationTarget.Global);
      return legacyValue;
    }

    return '';
  }

  static async setOpenAIApiKey(apiKey: string): Promise<void> {
    const value = apiKey.trim();

    if (!value) {
      await this.secretStorage.delete(this.SECRET_KEY);
      return;
    }

    await this.secretStorage.store(this.SECRET_KEY, value);
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

    return apiKey?.trim();
  }

  static async ensureApiKey(): Promise<string | undefined> {
    let apiKey = await this.getOpenAIApiKey();

    if (!apiKey) {
      const result = await vscode.window.showInformationMessage(
        'An OpenAI API key is required to generate MCP servers. Would you like to configure it now?',
        'Set API Key',
        'Cancel'
      );

      if (result === 'Set API Key') {
        apiKey = (await this.promptForApiKey()) || '';
      }
    }

    return apiKey || undefined;
  }

  static getDefaultLanguage(): 'typescript' | 'javascript' | 'python' {
    const config = vscode.workspace.getConfiguration(this.CONFIG_SECTION);
    return config.get<'typescript' | 'javascript' | 'python'>('defaultLanguage', 'typescript');
  }

  static async setDefaultLanguage(language: 'typescript' | 'javascript' | 'python'): Promise<void> {
    const config = vscode.workspace.getConfiguration(this.CONFIG_SECTION);
    await config.update('defaultLanguage', language, vscode.ConfigurationTarget.Global);
  }

  static getDefaultTransport(): 'stdio' | 'sse' {
    const config = vscode.workspace.getConfiguration(this.CONFIG_SECTION);
    return config.get<'stdio' | 'sse'>('defaultTransport', 'stdio');
  }

  static async setDefaultTransport(transport: 'stdio' | 'sse'): Promise<void> {
    const config = vscode.workspace.getConfiguration(this.CONFIG_SECTION);
    await config.update('defaultTransport', transport, vscode.ConfigurationTarget.Global);
  }
}
