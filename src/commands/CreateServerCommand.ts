import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { ConfigurationManager } from '../config/ConfigurationManager';
import { CodeGenerator, GenerationOptions } from '../generation/CodeGenerator';
import { OpenAIService } from '../services/OpenAIService';
import { GenerationRequest, SupportedLanguage, SupportedTransport } from '../types';
import { WebviewPanel } from '../ui/WebviewPanel';

interface CreateServerArguments extends Partial<GenerationRequest> {}

type StatusLevel = 'info' | 'success' | 'warning' | 'error';

export class CreateServerCommand {
  public static readonly commandName = 'mcp-server-builder.createServer';

  public static register(context: vscode.ExtensionContext): vscode.Disposable {
    const command = vscode.commands.registerCommand(this.commandName, (args?: CreateServerArguments) => {
      return this.execute(args);
    });

    context.subscriptions.push(command);
    return command;
  }

  private static async execute(initialArgs?: CreateServerArguments): Promise<void> {
    try {
      const request = await this.resolveGenerationRequest(initialArgs);
      if (!request) {
        this.sendStatusToWebview('warning', 'Generation cancelled.');
        return;
      }

      const serverName = await this.resolveServerName(request.description, initialArgs?.serverName);
      if (!serverName) {
        this.sendStatusToWebview('warning', 'Server creation cancelled before selecting a name.');
        return;
      }

      const targetInfo = await this.resolveTargetDirectory(serverName);
      if (!targetInfo) {
        this.sendStatusToWebview('warning', 'Server creation cancelled before choosing a destination.');
        return;
      }

      const generationOptions: GenerationOptions = {
        description: request.description,
        language: request.language,
        transport: request.transport,
        outputPath: targetInfo.fullPath,
        serverName: targetInfo.serverName
      };

      let apiKey = await ConfigurationManager.ensureApiKey();
      let useFallbackOnly = false;

      if (!apiKey) {
        const fallbackSelection = await vscode.window.showWarningMessage(
          'An OpenAI API key is required for AI-assisted generation. Do you want to continue with a local template instead?',
          'Use Local Template',
          'Cancel'
        );

        if (fallbackSelection !== 'Use Local Template') {
          this.sendStatusToWebview('warning', 'Server creation cancelled because no API key was provided.');
          return;
        }

        useFallbackOnly = true;
      }

      const generator = new CodeGenerator();
      let usedFallback = false;
      let openAIResponse = '';

      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: 'Generating MCP Server',
          cancellable: false
        },
        async (progress) => {
          progress.report({ increment: 5, message: 'Preparing generation request...' });

          if (!useFallbackOnly) {
            this.sendStatusToWebview('info', 'Contacting OpenAI to design the server.');
            try {
              const openAI = new OpenAIService(apiKey!);
              progress.report({ increment: 25, message: 'Requesting design from OpenAI...' });
              openAIResponse = await openAI.generateServerSpecification(request);
              progress.report({ increment: 35, message: 'Processing OpenAI response...' });
            } catch (error) {
              usedFallback = true;
              const message = error instanceof Error ? error.message : 'Unknown error';
              this.sendStatusToWebview('warning', `OpenAI request failed: ${message}. Falling back to local template.`);
              progress.report({ increment: 35, message: 'Falling back to local template...' });
              openAIResponse = this.buildFallbackResponse(generationOptions);
            }
          } else {
            usedFallback = true;
            this.sendStatusToWebview('info', 'Using local template to scaffold the server.');
            openAIResponse = this.buildFallbackResponse(generationOptions);
            progress.report({ increment: 30, message: 'Preparing local template...' });
          }

          if (!openAIResponse) {
            usedFallback = true;
            openAIResponse = this.buildFallbackResponse(generationOptions);
          }

          progress.report({ increment: 60, message: 'Creating project files...' });
          await generator.generateProject(generationOptions, openAIResponse);
          progress.report({ increment: 95, message: 'Finalising project...' });
        }
      );

      await this.openEntryFile(generationOptions);

      const baseMessage = `MCP server '${generationOptions.serverName}' created at ${targetInfo.fullPath}.`;
      const finalMessage = usedFallback
        ? `${baseMessage} Generated using the local template. You can refine the implementation manually.`
        : `${baseMessage} Generated using OpenAI.`;

      vscode.window.showInformationMessage(finalMessage, 'Open Folder').then((selection) => {
        if (selection === 'Open Folder') {
          vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(targetInfo.fullPath), true);
        }
      });

      this.sendStatusToWebview(
        'success',
        usedFallback
          ? 'Server created using the built-in template. Review and customise the generated files.'
          : 'Server created successfully with AI-assisted code generation.'
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      vscode.window.showErrorMessage(`Failed to create MCP server: ${message}`);
      this.sendStatusToWebview('error', `Failed to create server: ${message}`);
    }
  }

  private static async resolveGenerationRequest(initialArgs?: CreateServerArguments): Promise<GenerationRequest | undefined> {
    const description =
      initialArgs?.description ??
      (await vscode.window.showInputBox({
        prompt: 'Describe the MCP server you want to create',
        placeHolder: 'e.g., A server that provides weather information for any location',
        ignoreFocusOut: true
      }));

    if (!description || description.trim().length === 0) {
      return undefined;
    }

    const language = initialArgs?.language ?? (await this.pickLanguage());
    if (!language) {
      return undefined;
    }

    const transport = initialArgs?.transport ?? (await this.pickTransport());
    if (!transport) {
      return undefined;
    }

    return {
      description: description.trim(),
      language,
      transport
    };
  }

  private static async resolveServerName(description: string, providedName?: string): Promise<string | undefined> {
    if (providedName && providedName.trim().length > 0) {
      const sanitizedProvided = this.sanitizeName(providedName);
      if (sanitizedProvided) {
        return this.ensureServerSuffix(sanitizedProvided);
      }
    }

    const defaultName = this.slugify(description);

    const serverName = await vscode.window.showInputBox({
      prompt: 'Name for the new MCP server project',
      value: defaultName,
      ignoreFocusOut: true,
      validateInput: (value) => {
        if (!value || value.trim().length === 0) {
          return 'Server name cannot be empty.';
        }
        const sanitizedInput = this.sanitizeName(value);
        if (!sanitizedInput) {
          return 'Use letters, numbers, or dashes only.';
        }
        return null;
      }
    });

    if (!serverName) {
      return undefined;
    }

    const sanitized = this.sanitizeName(serverName);
    if (!sanitized) {
      return undefined;
    }

    return this.ensureServerSuffix(sanitized);
  }

  private static async resolveTargetDirectory(serverName: string): Promise<{ fullPath: string; serverName: string } | undefined> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    let basePath: string | undefined;

    if (workspaceFolders && workspaceFolders.length > 0) {
      const primaryFolder = workspaceFolders[0];
      const quickPickItems: Array<{ label: string; description: string; target: string | 'browse' }> = [
        {
          label: `Use workspace folder (${primaryFolder.name})`,
          description: primaryFolder.uri.fsPath,
          target: primaryFolder.uri.fsPath
        },
        {
          label: 'Choose another folder...',
          description: 'Select a different directory from your filesystem',
          target: 'browse'
        }
      ];

      const selection = await vscode.window.showQuickPick(quickPickItems, {
        placeHolder: 'Where should the MCP server be created?'
      });

      if (!selection) {
        return undefined;
      }

      if (selection.target === 'browse') {
        const picked = await vscode.window.showOpenDialog({
          canSelectFiles: false,
          canSelectFolders: true,
          canSelectMany: false,
          openLabel: 'Select destination folder'
        });

        if (!picked || picked.length === 0) {
          return undefined;
        }

        basePath = picked[0].fsPath;
      } else {
        basePath = selection.target;
      }
    } else {
      const picked = await vscode.window.showOpenDialog({
        canSelectFiles: false,
        canSelectFolders: true,
        canSelectMany: false,
        openLabel: 'Select destination folder'
      });

      if (!picked || picked.length === 0) {
        return undefined;
      }

      basePath = picked[0].fsPath;
    }

    const uniquePath = this.ensureUniqueDirectory(basePath, serverName);
    this.ensureDirectoryExists(uniquePath.fullPath);
    return uniquePath;
  }

  private static async openEntryFile(options: GenerationOptions): Promise<void> {
    const entryFile = this.getEntryFileName(options.language);
    const fullPath = path.join(options.outputPath, entryFile);

    if (!fs.existsSync(fullPath)) {
      return;
    }

    try {
      const document = await vscode.workspace.openTextDocument(fullPath);
      await vscode.window.showTextDocument(document, { preview: false });
    } catch (error) {
      console.warn('Failed to open generated entry file:', error);
    }
  }

  private static getEntryFileName(language: SupportedLanguage): string {
    switch (language) {
      case 'javascript':
        return 'server.js';
      case 'python':
        return 'server.py';
      default:
        return 'server.ts';
    }
  }

  private static ensureUniqueDirectory(basePath: string, preferredName: string): { fullPath: string; serverName: string } {
    let candidateName = preferredName;
    let attempt = 1;

    while (fs.existsSync(path.join(basePath, candidateName))) {
      candidateName = `${preferredName}-${attempt}`;
      attempt += 1;
    }

    return {
      fullPath: path.join(basePath, candidateName),
      serverName: candidateName
    };
  }

  private static ensureDirectoryExists(fullPath: string): void {
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
  }

  private static async pickLanguage(): Promise<SupportedLanguage | undefined> {
    const defaultLanguage = ConfigurationManager.getDefaultLanguage();
    const items = [
      { label: 'TypeScript', description: 'Generate a TypeScript MCP server', value: 'typescript' as SupportedLanguage },
      { label: 'JavaScript', description: 'Generate a JavaScript MCP server', value: 'javascript' as SupportedLanguage },
      { label: 'Python', description: 'Generate a Python MCP server', value: 'python' as SupportedLanguage }
    ];

    const orderedItems = [...items].sort((a, b) => (a.value === defaultLanguage ? -1 : b.value === defaultLanguage ? 1 : 0));

    const selection = await vscode.window.showQuickPick(orderedItems, {
      placeHolder: 'Select the programming language',
      ignoreFocusOut: true
    });

    return selection?.value;
  }

  private static async pickTransport(): Promise<SupportedTransport | undefined> {
    const defaultTransport = ConfigurationManager.getDefaultTransport();
    const items = [
      { label: 'stdio', description: 'Generate a server that communicates via stdio', value: 'stdio' as SupportedTransport },
      { label: 'sse', description: 'Generate a server that communicates via Server-Sent Events', value: 'sse' as SupportedTransport }
    ];

    const orderedItems = [...items].sort((a, b) => (a.value === defaultTransport ? -1 : b.value === defaultTransport ? 1 : 0));

    const selection = await vscode.window.showQuickPick(orderedItems, {
      placeHolder: 'Select the transport type',
      ignoreFocusOut: true
    });

    return selection?.value;
  }

  private static slugify(value: string): string {
    const sanitized = this.sanitizeName(value);
    if (!sanitized) {
      return 'mcp-server';
    }
    return this.ensureServerSuffix(sanitized);
  }

  private static sanitizeName(value: string): string {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/-{2,}/g, '-');
  }

  private static ensureServerSuffix(value: string): string {
    if (!value) {
      return value;
    }
    return value.endsWith('-server') ? value : `${value}-server`;
  }

  private static buildFallbackResponse(options: GenerationOptions): string {
    const readme = `# ${options.serverName}\n\n${options.description}\n\n## Getting Started\n\n` +
      this.getInstallSection(options.language) +
      '\n\n## Usage\n\n' +
      this.getUsageExample(options.language, options.serverName) +
      '\n\n## Next Steps\n\n' +
      'The generated server is a starting point. Update the tool handlers to connect your APIs or business logic.';

    return JSON.stringify({
      serverCode: '',
      readme,
      installInstructions: this.getInstallSection(options.language),
      usageExample: this.getUsageExample(options.language, options.serverName)
    });
  }

  private static getInstallSection(language: SupportedLanguage): string {
    switch (language) {
      case 'javascript':
      case 'typescript':
        return '```bash\nnpm install\nnpm run build\nnpm start\n```';
      case 'python':
        return '```bash\npython -m venv .venv\nsource .venv/bin/activate  # On Windows use .venv\\Scripts\\activate\npip install -r requirements.txt\npython server.py\n```';
    }
  }

  private static getUsageExample(language: SupportedLanguage, serverName: string): string {
    switch (language) {
      case 'python':
        return `Configure your MCP client with:\n\n\`\`\`json\n{\n  "mcpServers": {\n    "${serverName}": {\n      "command": "python",\n      "args": ["server.py"]\n    }\n  }\n}\n\`\`\``;
      case 'javascript':
      case 'typescript':
      default:
        return `Configure your MCP client with:\n\n\`\`\`json\n{\n  "mcpServers": {\n    "${serverName}": {\n      "command": "node",\n      "args": ["server.${language === 'typescript' ? 'ts' : 'js'}"]\n    }\n  }\n}\n\`\`\``;
    }
  }

  private static sendStatusToWebview(level: StatusLevel, message: string): void {
    WebviewPanel.sendMessage({
      type: 'generationStatus',
      level,
      message
    });
  }
}








