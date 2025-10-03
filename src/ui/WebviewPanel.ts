import * as vscode from 'vscode';

export class WebviewPanel {
  public static currentPanel: WebviewPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private _disposables: vscode.Disposable[] = [];

  public static createOrShow(extensionUri: vscode.Uri) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    // If we already have a panel, show it.
    if (WebviewPanel.currentPanel) {
      WebviewPanel.currentPanel._panel.reveal(column);
      return;
    }

    // Otherwise, create a new panel.
    const panel = vscode.window.createWebviewPanel(
      WebviewPanel.viewType,
      WebviewPanel.title,
      column || vscode.ViewColumn.One,
      {
        // Enable javascript in the webview
        enableScripts: true,
        // And restrict the webview to only loading content from our extension's directory.
        localResourceRoots: [extensionUri],
      }
    );

    WebviewPanel.currentPanel = new WebviewPanel(panel, extensionUri);
  }

  public static readonly viewType = 'mcp-server-builder.mainPanel';
  private static readonly title = 'MCP Server Builder';

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this._panel = panel;

    // Set the webview's initial html content
    this._update();

    // Listen for when the panel is disposed
    // This happens when the user closes the panel or when the panel is closed programatically
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    // Update the content based on view changes
    this._panel.onDidChangeViewState(
      () => this._update(),
      null,
      this._disposables
    );

    // Handle messages from the webview
    this._panel.webview.onDidReceiveMessage(
      message => this._onMessage(message),
      undefined,
      this._disposables
    );
  }

  public dispose() {
    WebviewPanel.currentPanel = undefined;

    // Clean up our resources
    this._panel.dispose();

    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }

  private _update() {
    const webview = this._panel.webview;
    this._panel.title = WebviewPanel.title;
    this._panel.webview.html = this._getHtmlForWebview(webview);
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${WebviewPanel.title}</title>
        <style>
            body {
                font-family: var(--vscode-font-family);
                padding: 0 20px;
                color: var(--vscode-foreground);
                background-color: var(--vscode-editor-background);
            }
            h1 {
                color: var(--vscode-foreground);
                border-bottom: 1px solid var(--vscode-panel-border);
                padding-bottom: 10px;
            }
            .container {
                display: flex;
                flex-direction: column;
                gap: 20px;
                margin-top: 20px;
            }
            .form-group {
                display: flex;
                flex-direction: column;
                gap: 5px;
            }
            label {
                font-weight: bold;
            }
            input, select, textarea {
                padding: 8px;
                border: 1px solid var(--vscode-input-border);
                background-color: var(--vscode-input-background);
                color: var(--vscode-input-foreground);
            }
            textarea {
                min-height: 100px;
                resize: vertical;
            }
            button {
                padding: 10px 20px;
                background-color: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
                border: none;
                cursor: pointer;
            }
            button:hover {
                background-color: var(--vscode-button-hoverBackground);
            }
            .status {
                margin-top: 20px;
                padding: 10px;
                border-radius: 4px;
            }
            .success {
                background-color: var(--vscode-testing-iconPassed);
                color: var(--vscode-button-foreground);
            }
            .error {
                background-color: var(--vscode-errorForeground);
                color: var(--vscode-button-foreground);
            }
        </style>
    </head>
    <body>
        <h1>MCP Server Builder</h1>
        <div class="container">
            <div class="form-group">
                <label for="description">Server Description</label>
                <textarea id="description" placeholder="Describe the MCP server you want to create..."></textarea>
            </div>
            <div class="form-group">
                <label for="language">Programming Language</label>
                <select id="language">
                    <option value="typescript">TypeScript</option>
                    <option value="javascript">JavaScript</option>
                    <option value="python">Python</option>
                </select>
            </div>
            <div class="form-group">
                <label for="transport">Transport Type</label>
                <select id="transport">
                    <option value="stdio">stdio</option>
                    <option value="sse">sse</option>
                </select>
            </div>
            <button id="generate">Generate Server</button>
            <div id="status" class="status" style="display: none;"></div>
        </div>
        
        <script>
            const vscode = acquireVsCodeApi();
            
            document.getElementById('generate').addEventListener('click', () => {
                const description = document.getElementById('description').value;
                const language = document.getElementById('language').value;
                const transport = document.getElementById('transport').value;
                
                if (!description) {
                    showStatus('Please enter a server description', 'error');
                    return;
                }
                
                showStatus('Generating server...', 'info');
                
                vscode.postMessage({
                    command: 'generateServer',
                    data: { description, language, transport }
                });
            });
            
            function showStatus(message, type) {
                const statusEl = document.getElementById('status');
                statusEl.textContent = message;
                statusEl.className = 'status ' + type;
                statusEl.style.display = 'block';
            }
        </script>
    </body>
    </html>`;
  }

  private _onMessage(message: any) {
    switch (message.command) {
      case 'generateServer':
        vscode.commands.executeCommand('mcp-server-builder.createServer');
        break;
    }
  }
}