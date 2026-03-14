const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const platform = process.platform;
const prebuiltDir = path.join(__dirname, '..', 'resources', 'prebuilt');
const binDir = path.join(prebuiltDir, 'bin');
const venvDir = path.join(prebuiltDir, 'venv');
const backendDir = path.join(__dirname, '..', 'backend');

function log(message) {
  console.log(`[Preinstall] ${message}`);
}

function execCommand(command, cwd = process.cwd()) {
  log(`Executing: ${command}`);
  try {
    execSync(command, { stdio: 'inherit', cwd });
  } catch (error) {
    console.error(`Failed to execute: ${command}`);
    throw error;
  }
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    log(`Created directory: ${dir}`);
  }
}

async function installUv() {
  log('Checking uv package manager...');
  ensureDir(binDir);

  // Check if uv is already installed globally
  const globalUvPaths = [
    '/usr/local/bin/uv',
    '/usr/bin/uv',
    path.join(process.env.HOME || '', '.local', 'bin', 'uv'),
    platform === 'win32' ? 'C:\\Users\\' + process.env.USERNAME + '\\AppData\\Local\\uv\\uv.exe' : ''
  ].filter(Boolean);

  for (const globalPath of globalUvPaths) {
    if (fs.existsSync(globalPath)) {
      log(`Found uv at: ${globalPath}`);
      return globalPath;
    }
  }

  // Install uv if not found
  log('Installing uv package manager...');

  const uvUrl =
    platform === 'darwin' || platform === 'linux'
      ? 'https://astral.sh/uv/install.sh'
      : 'https://astral.sh/uv/install.ps1';

  if (platform === 'darwin' || platform === 'linux') {
    execCommand(`curl -LsSf ${uvUrl} | sh`);
  } else {
    execCommand(`powershell -c "irm ${uvUrl} | iex"`);
  }

  // Try to find uv again after installation
  for (const globalPath of globalUvPaths) {
    if (fs.existsSync(globalPath)) {
      log(`uv installed at: ${globalPath}`);
      return globalPath;
    }
  }

  throw new Error('Failed to find uv after installation');
}

async function installPythonDeps(uvPath) {
  log('Creating Python virtual environment...');
  ensureDir(venvDir);

  if (platform === 'win32') {
    uvPath = uvPath.replace(/\\/g, '/');
    venvDir = venvDir.replace(/\\/g, '/');
  }

  // Clear existing venv if exists
  if (fs.existsSync(venvDir)) {
    log('Clearing existing virtual environment...');
    fs.rmSync(venvDir, { recursive: true, force: true });
  }

  execCommand(`${uvPath} venv ${venvDir} --python 3.12`);
  log('Virtual environment created');

  log('Installing Python dependencies...');
  execCommand(`${uvPath} pip install -r ${backendDir}/requirements.txt`, venvDir);
  
  log('Installing Harbor from local source...');
  const harborPath = path.join(__dirname, '..', '..', 'harbor');
  if (fs.existsSync(harborPath)) {
    execCommand(`${uvPath} pip install -e ${harborPath}`, venvDir);
  }
  
  log('Python dependencies installed');
}

async function main() {
  log('Starting pre-installation process...');
  log(`Platform: ${platform}`);

  try {
    const uvPath = await installUv();
    await installPythonDeps(uvPath);

    log('Pre-installation completed successfully!');
  } catch (error) {
    console.error('Pre-installation failed:', error);
    process.exit(1);
  }
}

main();
