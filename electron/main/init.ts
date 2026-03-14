import { spawn, ChildProcess } from 'child_process';
import { app } from 'electron';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { fixVenvPaths } from './utils/envUtil';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let backendProcess: ChildProcess | null = null;

export async function startBackend(): Promise<void> {
  const isDev = !app.isPackaged;

  let pythonPath: string;
  let backendPath: string;

  if (isDev) {
    pythonPath = 'python3';
    backendPath = join(__dirname, '../../backend');
  } else {
    const prebuiltDir = join(process.resourcesPath, 'prebuilt');

    fixVenvPaths(prebuiltDir);

    pythonPath = join(prebuiltDir, 'venv/bin/python');
    backendPath = join(process.resourcesPath, 'backend');
  }

  return new Promise((resolve, reject) => {
    backendProcess = spawn(
      pythonPath,
      ['-m', 'uvicorn', 'main:app', '--host', '127.0.0.1', '--port', '5001'],
      {
        cwd: backendPath,
        env: {
          ...process.env,
          PYTHONUNBUFFERED: '1',
        },
      }
    );

    backendProcess.stdout?.on('data', (data) => {
      console.log(`[Backend] ${data}`);
      if (data.toString().includes('Uvicorn running')) {
        resolve();
      }
    });

    backendProcess.stderr?.on('data', (data) => {
      console.error(`[Backend Error] ${data}`);
    });

    backendProcess.on('error', (error) => {
      console.error('Failed to start backend:', error);
      reject(error);
    });

    backendProcess.on('close', (code) => {
      console.log(`Backend process exited with code ${code}`);
      backendProcess = null;
    });

    setTimeout(() => {
      resolve();
    }, 3000);
  });
}

export function stopBackend(): void {
  if (backendProcess) {
    backendProcess.kill();
    backendProcess = null;
  }
}
