const fs = require('fs');
const path = require('path');

const prebuiltDir = path.join(__dirname, '..', 'resources', 'prebuilt');
const venvDir = path.join(prebuiltDir, 'venv');
const pyvenvCfgPath = path.join(venvDir, 'pyvenv.cfg');

function log(message) {
  console.log(`[FixVenvPaths] ${message}`);
}

function fixPyvenvCfg() {
  if (!fs.existsSync(pyvenvCfgPath)) {
    log('pyvenv.cfg not found, skipping...');
    return;
  }

  log('Fixing pyvenv.cfg paths...');
  let content = fs.readFileSync(pyvenvCfgPath, 'utf-8');

  const homeMatch = content.match(/^home\s*=\s*(.+)$/m);
  if (homeMatch) {
    const originalHome = homeMatch[1].trim();
    const cpythonMatch = originalHome.match(/(cpython-[\w.-]+)/);
    if (cpythonMatch) {
      const cpythonDir = cpythonMatch[1];
      const newHome = `{{PREBUILT_PYTHON_DIR}}/${cpythonDir}/bin`;
      content = content.replace(/^home\s*=\s*.+$/m, `home = ${newHome}`);
      fs.writeFileSync(pyvenvCfgPath, content, 'utf-8');
      log(`Updated home path: ${newHome}`);
    }
  }

  log('pyvenv.cfg paths fixed successfully!');
}

function main() {
  try {
    fixPyvenvCfg();
    log('All paths fixed successfully!');
  } catch (error) {
    console.error('Failed to fix paths:', error);
    process.exit(1);
  }
}

main();
