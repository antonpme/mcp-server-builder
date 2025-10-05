import * as cp from 'child_process';
import * as path from 'path';
import { downloadAndUnzipVSCode, resolveCliPathFromVSCodeExecutablePath } from '@vscode/test-electron';

async function main() {
  try {
    const extensionDevelopmentPath = path.resolve(__dirname, '../../');
    const extensionTestsPath = path.resolve(__dirname, './suite/index');

    const vscodeExecutablePath = await downloadAndUnzipVSCode('stable');
    const cliPath = resolveCliPathFromVSCodeExecutablePath(vscodeExecutablePath);

    const args = [
      `--extensionDevelopmentPath=${extensionDevelopmentPath}`,
      `--extensionTestsPath=${extensionTestsPath}`
    ];

    await new Promise<void>((resolve, reject) => {
      const shell = process.platform === 'win32';
      const child = cp.spawn(cliPath, args, { stdio: 'inherit', shell });

      child.on('error', reject);
      child.on('exit', code => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`VS Code exited with code ${code ?? 'null'}`));
        }
      });
    });
  } catch (err) {
    console.error('Failed to run tests');
    if (err instanceof Error) {
      console.error(err.message);
    }
    process.exit(1);
  }
}

main();
