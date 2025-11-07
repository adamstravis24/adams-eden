/* Preinstall hook to ensure node_modules can be created on EAS build workers */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function log(msg) {
  console.log(`[preinstall-fix] ${msg}`);
}

function ensureWritable(dir) {
  try {
    const testFile = path.join(dir, `.perm-test-${Date.now()}`);
    fs.writeFileSync(testFile, 'ok');
    fs.unlinkSync(testFile);
    return true;
  } catch (e) {
    log(`Write test failed in ${dir}: ${e.message}`);
    return false;
  }
}

function tryChmodRecursive(target) {
  try {
    // Prefer system chmod for speed and reliability
    execSync(`chmod -R u+rwX ${JSON.stringify(target)}`, { stdio: 'ignore' });
    return true;
  } catch (e) {
    log(`chmod -R failed: ${e.message}. Falling back to Node traversal.`);
    try {
      traverse(target, (p, isDir) => {
        try {
          fs.chmodSync(p, isDir ? 0o755 : 0o644);
        } catch (err) {
          // best effort
        }
      });
      return true;
    } catch (err2) {
      log(`Fallback chmod traversal failed: ${err2.message}`);
      return false;
    }
  }
}

function traverse(root, cb) {
  const st = fs.statSync(root);
  cb(root, st.isDirectory());
  if (st.isDirectory()) {
    for (const name of fs.readdirSync(root)) {
      const child = path.join(root, name);
      traverse(child, cb);
    }
  }
}

(function main() {
  // Skip on EAS Build - not needed there
  if (process.env.EAS_BUILD) {
    log('Running on EAS Build - skipping preinstall-fix');
    return;
  }

  const cwd = process.cwd();
  log(`CWD: ${cwd}`);
  // First, force perms on the whole project to be writable by current user
  tryChmodRecursive(cwd);

  // Remove any existing node_modules that could be a file/symlink/dir with bad perms
  const nm = path.join(cwd, 'node_modules');
  try {
    const st = fs.lstatSync(nm);
    if (st.isSymbolicLink() || st.isFile() || st.isDirectory()) {
      log('Removing existing node_modules');
      fs.rmSync(nm, { recursive: true, force: true });
    }
  } catch (_) {}

  // Recreate with permissive permissions
  try {
    // Ensure cwd is writable after chmod attempt
    if (!ensureWritable(cwd)) {
      tryChmodRecursive(cwd);
    }
    fs.mkdirSync(nm, { recursive: true, mode: 0o777 });
    tryChmodRecursive(nm);
    log('Created node_modules with mode 0777');
  } catch (e) {
    log(`Failed to create node_modules: ${e.message}`);
  }

  // Final write test
  ensureWritable(cwd);
  ensureWritable(nm);
  log('preinstall-fix complete');
})();
