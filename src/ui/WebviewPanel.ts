import * as vscode from 'vscode';

type WebviewMessage = {
  command?: string;
  data?: {
    description?: string;
    language?: string;
    transport?: string;
    serverName?: string;
  };
};

export class WebviewPanel {
  public static currentPanel: WebviewPanel | undefined;
  public static readonly viewType = 'mcp-server-builder.mainPanel';
  private static readonly title = 'MCP Server Builder';

  private readonly _panel: vscode.WebviewPanel;
  private _disposables: vscode.Disposable[] = [];

  public static createOrShow(extensionUri: vscode.Uri) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    if (WebviewPanel.currentPanel) {
      WebviewPanel.currentPanel._panel.reveal(column);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      WebviewPanel.viewType,
      WebviewPanel.title,
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [extensionUri]
      }
    );

    WebviewPanel.currentPanel = new WebviewPanel(panel, extensionUri);
  }

  public static sendMessage(message: unknown): void {
    WebviewPanel.currentPanel?._panel.webview.postMessage(message);
  }

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this._panel = panel;

    this._update();

    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    this._panel.onDidChangeViewState(
      () => this._update(),
      null,
      this._disposables
    );

    this._panel.webview.onDidReceiveMessage(
      (message) => this._onMessage(message),
      undefined,
      this._disposables
    );
  }

  public dispose() {
    WebviewPanel.currentPanel = undefined;

    this._panel.dispose();

    while (this._disposables.length) {
      const disposable = this._disposables.pop();
      disposable?.dispose();
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
      padding: 0 20px 40px;
      color: var(--vscode-foreground);
      background-color: var(--vscode-editor-background);
    }

    h1 {
      color: var(--vscode-foreground);
      border-bottom: 1px solid var(--vscode-panel-border);
      padding-bottom: 10px;
      margin-bottom: 16px;
    }

    .container {
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    label {
      font-weight: 600;
    }

    .hint {
      font-size: 12px;
      color: var(--vscode-descriptionForeground);
    }

    input, select, textarea {
      padding: 8px;
      border: 1px solid var(--vscode-input-border);
      background-color: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      border-radius: 4px;
    }

    textarea {
      min-height: 110px;
      resize: vertical;
    }

    button {
      width: fit-content;
      padding: 10px 24px;
      background-color: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border: none;
      border-radius: 4px;
      cursor: pointer;
      transition: background-color 0.2s ease;
    }

    button:hover:not(:disabled) {
      background-color: var(--vscode-button-hoverBackground);
    }

    button:disabled {
      opacity: 0.6;
      cursor: progress;
    }

    .status {
      display: none;
      margin-top: 10px;
      padding: 12px 14px;
      border-radius: 4px;
      border-left: 4px solid transparent;
      line-height: 1.4;
      transition: opacity 0.2s ease;
    }

    .status.info {
      display: block;
      background-color: rgba(128, 128, 128, 0.15);
      border-left-color: var(--vscode-notificationsInfoIcon-foreground, #3794ff);
    }

    .status.success {
      display: block;
      background-color: rgba(56, 142, 60, 0.2);
      border-left-color: var(--vscode-testing-iconPassed, #56C271);
      color: var(--vscode-foreground);
    }

    .status.warning {
      display: block;
      background-color: var(--vscode-inputValidation-warningBackground, rgba(204, 141, 0, 0.2));
      border-left-color: var(--vscode-inputValidation-warningBorder, #c29a33);
      color: var(--vscode-inputValidation-warningForeground, #ffffff);
    }

    .status.error {
      display: block;
      background-color: var(--vscode-inputValidation-errorBackground, rgba(255, 82, 82, 0.2));
      border-left-color: var(--vscode-inputValidation-errorBorder, #ff4f4f);
      color: var(--vscode-inputValidation-errorForeground, #ffffff);
    }
  </style>
</head>
<body>
  <h1>MCP Server Builder</h1>
  <div class="container">
    <div class="form-group">
      <label for="description">Server Description</label>
      <textarea id="description" placeholder="Describe the MCP server you want to create..."></textarea>
      <span class="hint">Explain the tools, resources, and behaviour you need.</span>
    </div>

    <div class="form-group">
      <label for="serverName">Project Name</label>
      <input id="serverName" type="text" placeholder="weather-server" autocomplete="off" />
      <span class="hint">Used for the project folder and server identifier.</span>
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

    <button id="generate" type="button">Generate Server</button>
    <div id="status" class="status" aria-live="polite"></div>
  </div>

  <script>
    (function () {
      const vscode = acquireVsCodeApi();
      const descriptionField = document.getElementById('description');
      const serverNameField = document.getElementById('serverName');
      const languageField = document.getElementById('language');
      const transportField = document.getElementById('transport');
      const statusEl = document.getElementById('status');
      const generateButton = document.getElementById('generate');

      let generating = false;

      function slugify(value) {
        return value
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')
          .replace(/-{2,}/g, '-');
      }

      descriptionField.addEventListener('blur', () => {
        if (serverNameField.value.trim().length === 0) {
          const suggestion = slugify(descriptionField.value || '');
          if (suggestion) {
            serverNameField.value = suggestion.endsWith('-server') ? suggestion : suggestion + '-server';
          }
        }
      });

      generateButton.addEventListener('click', () => {
        if (generating) {
          return;
        }

        const description = descriptionField.value.trim();
        const serverName = serverNameField.value.trim();
        const language = languageField.value;
        const transport = transportField.value;

        if (!description) {
          showStatus('Please enter a server description.', 'warning');
          return;
        }

        if (!serverName) {
          showStatus('Please provide a project name.', 'warning');
          return;
        }

        generating = true;
        updateButtonState();
        showStatus('Starting generation...', 'info');

        vscode.postMessage({
          command: 'generateServer',
          data: { description, language, transport, serverName }
        });
      });

      window.addEventListener('message', (event) => {
        const message = event.data;
        if (message?.type === 'generationStatus') {
          showStatus(message.message || '', message.level || 'info');
          if (['success', 'error', 'warning'].includes(message.level)) {
            generating = false;
            updateButtonState();
          }
        }
      });

      function updateButtonState() {
        if (generating) {
          generateButton.disabled = true;
          generateButton.textContent = 'Generating...';
        } else {
          generateButton.disabled = false;
          generateButton.textContent = 'Generate Server';
        }
      }

      function showStatus(message, level) {
        statusEl.textContent = message;
        statusEl.className = 'status ' + level;
        statusEl.style.display = message ? 'block' : 'none';
      }

      updateButtonState();
      showStatus('', 'info');
    })();
  </script>
</body>
</html>`;
  }

  private _onMessage(message: WebviewMessage) {
    if (message?.command === 'generateServer') {
      vscode.commands.executeCommand('mcp-server-builder.createServer', message.data ?? {});
    }
  }
}
