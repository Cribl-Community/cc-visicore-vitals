import { createWriteStream } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pipeline } from 'node:stream/promises';
import { parseArgs } from 'node:util';
import { createAppPack } from './pkgutil.mjs';

const rootDir = join(import.meta.dirname, '..');
const buildOutDir = join(rootDir, 'build');
const packageJsonPath = join(rootDir, 'package.json');
const semverPattern = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

function parseVersion(version) {
  const match = semverPattern.exec(version);
  if (!match) {
    throw new Error(`Invalid version "${version}". Expected X.Y.Z.`);
  }
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  };
}

function formatVersion(version) {
  return `${version.major}.${version.minor}.${version.patch}`;
}

function processArgs() {
  const args = parseArgs({
    options: {
      minor: { type: 'boolean' },
      major: { type: 'boolean' },
      version: { type: 'string' },
    },
  });
  let bump = 'patch';
  let explicitVersion;
  if (args.values.minor) {
    bump = 'minor';
  } else if (args.values.major) {
    bump = 'major';
  } else if (args.values.version) {
    explicitVersion = args.values.version;
  }
  return { bump, explicitVersion };
}

function nextVersion(currentVersion) {
  const { bump, explicitVersion } = processArgs();
  if (explicitVersion) {
    parseVersion(explicitVersion);
    return explicitVersion;
  }

  const version = parseVersion(currentVersion);
  if (bump === 'major') {
    return formatVersion({ major: version.major + 1, minor: 0, patch: 0 });
  }
  if (bump === 'minor') {
    return formatVersion({ major: version.major, minor: version.minor + 1, patch: 0 });
  }
  return formatVersion({ major: version.major, minor: version.minor, patch: version.patch + 1 });
}

const packageInfo = JSON.parse(await readFile(packageJsonPath, 'utf8'));
packageInfo.version = nextVersion(packageInfo.version || '0.0.0');
await writeFile(packageJsonPath, `${JSON.stringify(packageInfo, null, 2)}\n`);

const tgzName = `${packageInfo.name || 'app'}-${packageInfo.version}.tgz`;
const tgzPath = join(buildOutDir, tgzName);
await mkdir(buildOutDir, { recursive: true });
const { closePromise, stdout } = await createAppPack(false);
await Promise.all([pipeline(stdout, createWriteStream(tgzPath)), closePromise]);

console.log(`\nPackage created: ${tgzPath}`);
