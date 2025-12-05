/**
 * Configuration file fingerprinting for index regeneration detection
 */

import type { ConfigFingerprint } from '@pleaseai/mcp-core'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

export type ScopeType = 'local' | 'project' | 'user'

/**
 * Get config file path based on scope
 */
export function getConfigPath(scope: ScopeType, cwd: string = process.cwd()): string {
  const home = homedir()

  switch (scope) {
    case 'project':
      return join(cwd, '.please', 'mcp.json')
    case 'user':
      return join(home, '.please', 'mcp.json')
    case 'local':
    default:
      return join(cwd, '.please', 'mcp.local.json')
  }
}

/**
 * Create fingerprint for a single config file
 */
export function createConfigFingerprint(filePath: string): ConfigFingerprint {
  if (!existsSync(filePath)) {
    return { exists: false }
  }

  try {
    const content = readFileSync(filePath, 'utf-8')
    const hash = createHash('sha256').update(content).digest('hex')
    const mtime = statSync(filePath).mtimeMs
    return { exists: true, hash, mtime }
  }
  catch {
    return { exists: false }
  }
}

/**
 * Create fingerprints for all config scopes
 */
export function createAllConfigFingerprints(cwd?: string): {
  local?: ConfigFingerprint
  project?: ConfigFingerprint
  user?: ConfigFingerprint
} {
  return {
    local: createConfigFingerprint(getConfigPath('local', cwd)),
    project: createConfigFingerprint(getConfigPath('project', cwd)),
    user: createConfigFingerprint(getConfigPath('user', cwd)),
  }
}

/**
 * Get CLI version from package.json
 */
export function getCliVersion(): string {
  try {
    // Get the directory of the current module
    const currentDir = fileURLToPath(new URL('.', import.meta.url))
    // Navigate up to find package.json (from dist/utils/ to package root)
    const packageJsonPath = join(currentDir, '..', '..', 'package.json')

    if (existsSync(packageJsonPath)) {
      const content = readFileSync(packageJsonPath, 'utf-8')
      const pkg = JSON.parse(content) as { version: string }
      return pkg.version
    }

    // Fallback: try relative to current working directory
    const cwdPackagePath = join(process.cwd(), 'package.json')
    if (existsSync(cwdPackagePath)) {
      const content = readFileSync(cwdPackagePath, 'utf-8')
      const pkg = JSON.parse(content) as { version: string }
      return pkg.version
    }

    return 'unknown'
  }
  catch {
    return 'unknown'
  }
}
