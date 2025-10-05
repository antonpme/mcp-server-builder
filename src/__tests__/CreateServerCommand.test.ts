jest.mock('vscode', () => ({
  window: {
    showQuickPick: jest.fn(),
    showInputBox: jest.fn(),
    showOpenDialog: jest.fn(),
    showInformationMessage: jest.fn(),
    showWarningMessage: jest.fn(),
    showErrorMessage: jest.fn(),
    withProgress: jest.fn(async (_options: any, task: any) => task({ report: () => {} })),
    activeTextEditor: undefined
  },
  workspace: {
    workspaceFolders: [] as any[],
    getConfiguration: jest.fn().mockReturnValue({
      get: jest.fn(),
      update: jest.fn()
    })
  },
  commands: {
    registerCommand: jest.fn(),
    executeCommand: jest.fn(),
    getCommands: jest.fn().mockResolvedValue([])
  },
  ProgressLocation: {
    Notification: 15
  },
  Uri: {
    file: (fsPath: string) => ({ fsPath })
  },
  ConfigurationTarget: {
    Global: 1
  }
}), { virtual: true });

import { CreateServerCommand } from '../commands/CreateServerCommand';
import { GenerationOptions } from '../generation/CodeGenerator';

describe('CreateServerCommand helpers', () => {
  const callPrivate = (name: string, ...args: unknown[]) =>
    (CreateServerCommand as unknown as Record<string, (...fnArgs: unknown[]) => unknown>)[name](...args);

  it('sanitizes raw names into slugified format', () => {
    expect(callPrivate('sanitizeName', 'Weather Tools')).toBe('weather-tools');
    expect(callPrivate('sanitizeName', 'Weather@Tools!!')).toBe('weather-tools');
    expect(callPrivate('sanitizeName', '  MIXED_case  ')).toBe('mixed-case');
  });

  it('ensures server suffix is appended once', () => {
    expect(callPrivate('ensureServerSuffix', 'weather-tools')).toBe('weather-tools-server');
    expect(callPrivate('ensureServerSuffix', 'weather-server')).toBe('weather-server');
  });

  it('builds a fallback response with language specific instructions', () => {
    const options: GenerationOptions = {
      description: 'Test fallback generation',
      language: 'python',
      transport: 'stdio',
      outputPath: '/tmp/test',
      serverName: 'test-server'
    };

    const fallbackJson = callPrivate('buildFallbackResponse', options) as string;
    const fallback = JSON.parse(fallbackJson);

    expect(fallback.installInstructions).toContain('python -m venv');
    expect(fallback.usageExample).toContain('"test-server"');
    expect(fallback.readme).toContain(options.description);
  });
});
