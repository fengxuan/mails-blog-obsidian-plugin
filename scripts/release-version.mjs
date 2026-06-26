import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(scriptDir, '..')

const options = parseArgs(process.argv.slice(2))

if (options.help) {
  printUsage()
  process.exit(0)
}

process.chdir(repoRoot)

const currentBranch = getCurrentBranch()
const remoteUrl = getOriginUrl()
const releaseUrlBase = toGitHubHttpsUrl(remoteUrl)

if (!options.skipFetch) {
  runCommand('git', ['fetch', '--tags', 'origin'], options.dryRun)
}

if (!options.allowDirty) {
  requireCleanWorktree()
}

if (!options.allowNonMain) {
  requireBranch(currentBranch, 'main')
}

requireUpstreamInSync()

const latestTag = getLatestReleaseTag()
const pkg = readJson('package.json')
const manifest = readJson('manifest.json')
const versions = readJson('versions.json')

ensureReleaseMetadataIsConsistent({ pkg, manifest, versions, latestTag })

const currentVersion = manifest.version
const targetVersion = options.version ?? bumpVersion(currentVersion, options.bump)
validateVersion(targetVersion, 'release version')

if (compareVersions(targetVersion, currentVersion) <= 0) {
  fail(`target version ${targetVersion} must be greater than current version ${currentVersion}`)
}

if (releaseTagExists(targetVersion)) {
  fail(`tag already exists: ${targetVersion}`)
}

const targetMinAppVersion = options.minAppVersion ?? manifest.minAppVersion
validateVersion(targetMinAppVersion, 'min app version')

console.log(`Current version: ${currentVersion}`)
if (latestTag) {
  console.log(`Latest tag: ${latestTag}`)
}
console.log(`Target version: ${targetVersion}`)
console.log(`Target minAppVersion: ${targetMinAppVersion}`)

runCommand('npm', ['version', '--no-git-tag-version', targetVersion], options.dryRun)

if (!options.dryRun) {
  const nextManifest = {
    ...manifest,
    version: targetVersion,
    minAppVersion: targetMinAppVersion,
  }
  writeJson('manifest.json', nextManifest)

  const nextVersions = {
    ...versions,
    [targetVersion]: targetMinAppVersion,
  }
  writeJson('versions.json', sortVersionMap(nextVersions))
}

runCommand('npm', ['run', 'release:package'], options.dryRun)

runCommand(
  'git',
  [
    'add',
    'package.json',
    'package-lock.json',
    'manifest.json',
    'versions.json',
    'main.js',
    'release/mails-blog-publisher',
  ],
  options.dryRun,
)

runCommand('git', ['commit', '-m', `Release ${targetVersion}`], options.dryRun)
runCommand('git', ['tag', '-a', targetVersion, '-m', `Mails Blog Publisher ${targetVersion}`], options.dryRun)

if (options.skipPush) {
  console.log('')
  console.log('Release commit and tag were created locally only.')
  console.log('Push them later with:')
  console.log(`  git push origin ${currentBranch} --follow-tags`)
} else {
  runCommand('git', ['push', 'origin', currentBranch, '--follow-tags'], options.dryRun)
}

console.log('')
if (options.dryRun) {
  console.log('Dry run only. No files or git state were changed.')
} else {
  console.log('Release triggered.')
}

if (releaseUrlBase) {
  console.log(`Workflow: ${releaseUrlBase}/actions/workflows/release.yml`)
  console.log(`Expected release: ${releaseUrlBase}/releases/tag/${targetVersion}`)
}

console.log('Obsidian review portal: https://community.obsidian.md/account/plugins')
console.log('After the GitHub release is live, add this version there to enter Obsidian review.')

function printUsage() {
  console.log(`Usage:
  npm run release:new -- [version] [options]

This command bumps the Obsidian plugin release version, updates release metadata,
packages the release folder, commits the release, creates the Git tag, and pushes
the branch plus tag so the existing GitHub Actions release workflow can publish
the GitHub Release automatically.

Options:
  --version VERSION         Release a specific version, for example 1.0.15
  --patch                   Bump the current version by one patch version (default)
  --minor                   Bump the current version by one minor version
  --major                   Bump the current version by one major version
  --min-app-version VALUE   Override manifest.json minAppVersion for this release
  --skip-fetch              Skip git fetch --tags origin
  --skip-push               Create the release commit and tag locally only
  --allow-dirty             Skip the clean working tree check
  --allow-non-main          Allow running from a branch other than main
  --dry-run                 Print the actions without changing files or git state
  --help, -h                Show this help message

Examples:
  npm run release:new -- 1.0.15
  npm run release:new -- --minor
  npm run release:new -- --min-app-version 1.8.0
  npm run release:new -- --dry-run --skip-push
`)
}

function parseArgs(argv) {
  const parsed = {
    bump: 'patch',
    version: null,
    minAppVersion: null,
    skipFetch: false,
    skipPush: false,
    allowDirty: false,
    allowNonMain: false,
    dryRun: false,
    help: false,
  }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    switch (arg) {
      case '--version':
        parsed.version = requireValue(argv, ++index, '--version')
        break
      case '--patch':
        parsed.bump = 'patch'
        break
      case '--minor':
        parsed.bump = 'minor'
        break
      case '--major':
        parsed.bump = 'major'
        break
      case '--min-app-version':
        parsed.minAppVersion = requireValue(argv, ++index, '--min-app-version')
        break
      case '--skip-fetch':
        parsed.skipFetch = true
        break
      case '--skip-push':
        parsed.skipPush = true
        break
      case '--allow-dirty':
        parsed.allowDirty = true
        break
      case '--allow-non-main':
        parsed.allowNonMain = true
        break
      case '--dry-run':
        parsed.dryRun = true
        break
      case '--help':
      case '-h':
        parsed.help = true
        break
      default:
        if (!parsed.version && /^\d+\.\d+\.\d+$/.test(arg)) {
          parsed.version = arg
          break
        }
        fail(`unknown argument: ${arg}`)
    }
  }

  if (parsed.version) {
    validateVersion(parsed.version, 'release version')
  }

  if (parsed.minAppVersion) {
    validateVersion(parsed.minAppVersion, 'min app version')
  }

  return parsed
}

function requireValue(argv, index, flag) {
  const value = argv[index]
  if (!value) {
    fail(`${flag} requires a value`)
  }
  return value
}

function validateVersion(version, label) {
  if (!/^\d+\.\d+\.\d+$/.test(version)) {
    fail(`${label} must look like X.Y.Z, got: ${version}`)
  }
}

function compareVersions(left, right) {
  const leftParts = left.split('.').map(Number)
  const rightParts = right.split('.').map(Number)

  for (let index = 0; index < Math.max(leftParts.length, rightParts.length); index += 1) {
    const leftPart = leftParts[index] ?? 0
    const rightPart = rightParts[index] ?? 0
    if (leftPart > rightPart) {
      return 1
    }
    if (leftPart < rightPart) {
      return -1
    }
  }

  return 0
}

function bumpVersion(version, bump) {
  const [major, minor, patch] = version.split('.').map(Number)
  switch (bump) {
    case 'patch':
      return `${major}.${minor}.${patch + 1}`
    case 'minor':
      return `${major}.${minor + 1}.0`
    case 'major':
      return `${major + 1}.0.0`
    default:
      fail(`unsupported release bump: ${bump}`)
  }
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), 'utf8'))
}

function writeJson(relativePath, value) {
  fs.writeFileSync(path.join(repoRoot, relativePath), `${JSON.stringify(value, null, 2)}\n`)
}

function sortVersionMap(versionMap) {
  return Object.fromEntries(
    Object.entries(versionMap).sort(([leftVersion], [rightVersion]) => compareVersions(leftVersion, rightVersion)),
  )
}

function runCommand(command, args, dryRun) {
  console.log(`+ ${command} ${args.join(' ')}`)

  if (dryRun) {
    return
  }

  const result = spawnSync(command, args, {
    cwd: repoRoot,
    stdio: 'inherit',
  })

  if (result.status !== 0) {
    fail(`${command} ${args.join(' ')} failed with exit code ${result.status ?? 'unknown'}`)
  }
}

function captureCommand(command, args, allowFailure = false) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf8',
  })

  if (result.status !== 0) {
    if (allowFailure) {
      return ''
    }
    const stderr = result.stderr.trim()
    fail(stderr || `${command} ${args.join(' ')} failed with exit code ${result.status ?? 'unknown'}`)
  }

  return result.stdout.trim()
}

function requireCleanWorktree() {
  const status = captureCommand('git', ['status', '--short'])
  if (!status) {
    return
  }
  console.error(status)
  fail('working tree is not clean; commit or stash changes first, or pass --allow-dirty')
}

function getCurrentBranch() {
  const branch = captureCommand('git', ['branch', '--show-current'])
  if (!branch) {
    fail('could not determine current branch')
  }
  return branch
}

function requireBranch(actual, expected) {
  if (actual !== expected) {
    fail(`current branch is ${actual}; switch to ${expected} or pass --allow-non-main`)
  }
}

function requireUpstreamInSync() {
  const upstream = captureCommand(
    'git',
    ['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{upstream}'],
    true,
  )

  if (!upstream) {
    return
  }

  const counts = captureCommand('git', ['rev-list', '--left-right', '--count', `${upstream}...HEAD`])
  const [behindCount = '0', aheadCount = '0'] = counts.split(/\s+/)
  if (behindCount !== '0' || aheadCount !== '0') {
    fail(`branch is not in sync with ${upstream}; push/pull first or rerun with the correct branch state`)
  }
}

function getLatestReleaseTag() {
  const tags = captureCommand('git', ['tag', '-l', '[0-9]*.[0-9]*.[0-9]*', '--sort=-version:refname'])
  if (!tags) {
    return ''
  }
  const [latestTag] = tags.split('\n')
  validateVersion(latestTag, 'latest release tag')
  return latestTag
}

function releaseTagExists(tagName) {
  const result = spawnSync('git', ['rev-parse', '-q', '--verify', `refs/tags/${tagName}`], {
    cwd: repoRoot,
    stdio: 'ignore',
  })

  return result.status === 0
}

function ensureReleaseMetadataIsConsistent({ pkg, manifest, versions, latestTag }) {
  validateVersion(pkg.version, 'package.json version')
  validateVersion(manifest.version, 'manifest.json version')
  validateVersion(manifest.minAppVersion, 'manifest.json minAppVersion')

  if (pkg.version !== manifest.version) {
    fail(`package.json version ${pkg.version} does not match manifest.json version ${manifest.version}`)
  }

  if (versions[manifest.version] !== manifest.minAppVersion) {
    fail(`versions.json must map ${manifest.version} to ${manifest.minAppVersion}`)
  }

  if (latestTag && compareVersions(manifest.version, latestTag) < 0) {
    fail(`manifest.json version ${manifest.version} is behind latest tag ${latestTag}`)
  }
}

function getOriginUrl() {
  return captureCommand('git', ['remote', 'get-url', 'origin'], true)
}

function toGitHubHttpsUrl(remoteUrl) {
  if (!remoteUrl) {
    return ''
  }

  if (remoteUrl.startsWith('git@github.com:')) {
    return `https://github.com/${remoteUrl.slice('git@github.com:'.length).replace(/\.git$/, '')}`
  }

  if (remoteUrl.startsWith('https://github.com/')) {
    return remoteUrl.replace(/\.git$/, '')
  }

  return ''
}

function fail(message) {
  console.error(`error: ${message}`)
  process.exit(1)
}
