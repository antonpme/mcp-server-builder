import * as assert from 'assert';
import * as vscode from 'vscode';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
// import * as myExtension from '../../extension';

suite('Extension Test Suite', () => {
  vscode.window.showInformationMessage('Start all tests.');

  test('Extension should be present', () => {
    assert.ok(vscode.extensions.getExtension('mcp-server-builder.mcp-server-builder'));
  });

  test('Extension should activate', async () => {
    const extension = vscode.extensions.getExtension('mcp-server-builder.mcp-server-builder');
    await extension?.activate();
    assert.ok(true);
  });

  test('Should register all commands', async () => {
    const commands = await vscode.commands.getCommands();
    const commandExists = commands.includes('mcp-server-builder.createServer');
    assert.ok(commandExists);
  });
});