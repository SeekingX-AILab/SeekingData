const fs = require('fs');
const path = require('path');

const prebuiltDir = path.join(__dirname, '..', 'resources', 'prebuilt');
const venvDir = path.join(prebuiltDir, 'venv');

function log(message) {
  console.log(`[FixSymlinks] ${message}`);
}

function fixSymlinks(dir) {
  const items = fs.readdirSync(dir, { withFileTypes: true });

  items.forEach((item) => {
    const fullPath = path.join(dir, item.name);

    if (item.isSymbolicLink()) {
      const linkTarget = fs.readlinkSync(fullPath);
      const absoluteTarget = path.resolve(dir, linkTarget);

      if (!fs.existsSync(absoluteTarget)) {
        log(`Warning: Broken symlink at ${fullPath} -> ${linkTarget}`);
      }
    } else if (item.isDirectory()) {
      fixSymlinks(fullPath);
    }
  });
}

function main() {
  try {
    if (fs.existsSync(venvDir)) {
      log('Checking symlinks in virtual environment...');
      fixSymlinks(venvDir);
      log('Symlinks checked successfully!');
    } else {
      log('Virtual environment not found, skipping symlink check...');
    }
  } catch (error) {
    console.error('Failed to check symlinks:', error);
    process.exit(1);
  }
}

main();
