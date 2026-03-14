import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

export function fixVenvPaths(prebuiltDir: string): void {
  const venvPath = join(prebuiltDir, 'venv');
  const pyvenvCfgPath = join(venvPath, 'pyvenv.cfg');

  if (!existsSync(pyvenvCfgPath)) {
    console.log('pyvenv.cfg not found, skipping path fix');
    return;
  }

  let content = readFileSync(pyvenvCfgPath, 'utf-8');

  if (content.includes('{{PREBUILT_PYTHON_DIR}}')) {
    const uvPythonDir = join(prebuiltDir, 'uv_python');
    content = content.replace(/\{\{PREBUILT_PYTHON_DIR\}\}/g, uvPythonDir);
    writeFileSync(pyvenvCfgPath, content, 'utf-8');
    console.log('Fixed venv paths in pyvenv.cfg');
  }
}

export function getResourcePath(...paths: string[]): string {
  return join(process.resourcesPath, ...paths);
}

export function getPrebuiltPath(...paths: string[]): string {
  return getResourcePath('prebuilt', ...paths);
}
