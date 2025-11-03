/* Preinstall hook to ensure node_modules can be created on EAS buildworkers */
const fs = require('fs');
const path = require('path');

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

(function main() {
  const cwd = process.cwd();
  log(`CWD: ${cwd}`);

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
    fs.mkdirSync(nm, { recursive: true, mode: 0o777 });
    log('Created node_modules with mode 0777');
  } catch (e) {
    log(`Failed to create node_modules: ${e.message}`);
  }

  // Final write test
  ensureWritable(cwd);
  ensureWritable(nm);
  log('preinstall-fix complete');
})();
