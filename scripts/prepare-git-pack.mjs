/**
 * Materialize the Cribl App Platform pack layout at the repo root for Git-based
 * installs. Writes `static/` (from `dist/`) and `default/proxies.yml` +
 * `default/policies.yml` (from `config/`). Run after `npm run build`; release CI
 * commits the output onto the release tag so Cribl "Import from Git" can serve it.
 *
 * Usage: node scripts/prepare-git-pack.mjs [--version X.Y.Z]
 */
import { prepareGitPackLayout } from './pkgutil.mjs';

const versionArgIdx = process.argv.indexOf('--version');
const versionOverride = versionArgIdx !== -1 ? process.argv[versionArgIdx + 1] : undefined;

await prepareGitPackLayout(versionOverride);
console.log('Git pack layout ready: static/, default/');
