import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import {
  createAllConfigFingerprints,
  createConfigFingerprint,
  getCliVersion,
  getConfigPath,
} from '../src/utils/config-fingerprint.js'

describe('config-fingerprint', () => {
  let testDir: string

  beforeEach(() => {
    testDir = join(tmpdir(), `config-fingerprint-test-${Date.now()}`)
    mkdirSync(testDir, { recursive: true })
  })

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true })
  })

  describe('getConfigPath', () => {
    test('should return local config path', () => {
      const path = getConfigPath('local', testDir)
      expect(path).toBe(join(testDir, '.please', 'mcp.local.json'))
    })

    test('should return project config path', () => {
      const path = getConfigPath('project', testDir)
      expect(path).toBe(join(testDir, '.please', 'mcp.json'))
    })

    test('should return user config path', () => {
      const path = getConfigPath('user', testDir)
      // User path uses homedir, not cwd
      expect(path).toContain('.please')
      expect(path).toContain('mcp.json')
      expect(path).not.toContain(testDir)
    })
  })

  describe('createConfigFingerprint', () => {
    test('should return exists: false for non-existent file', () => {
      const result = createConfigFingerprint(join(testDir, 'nonexistent.json'))
      expect(result).toEqual({ exists: false })
    })

    test('should return exists: true with hash for existing file', () => {
      const filePath = join(testDir, 'config.json')
      writeFileSync(filePath, '{"test": "value"}')

      const result = createConfigFingerprint(filePath)

      expect(result.exists).toBe(true)
      if (result.exists) {
        expect(result.hash).toBeDefined()
        expect(result.hash.length).toBe(64) // SHA-256 produces 64 hex chars
      }
    })

    test('should produce same hash for same content', () => {
      const filePath1 = join(testDir, 'config1.json')
      const filePath2 = join(testDir, 'config2.json')
      const content = '{"test": "value"}'

      writeFileSync(filePath1, content)
      writeFileSync(filePath2, content)

      const result1 = createConfigFingerprint(filePath1)
      const result2 = createConfigFingerprint(filePath2)

      expect(result1.exists).toBe(true)
      expect(result2.exists).toBe(true)
      if (result1.exists && result2.exists) {
        expect(result1.hash).toBe(result2.hash)
      }
    })

    test('should produce different hash for different content', () => {
      const filePath1 = join(testDir, 'config1.json')
      const filePath2 = join(testDir, 'config2.json')

      writeFileSync(filePath1, '{"test": "value1"}')
      writeFileSync(filePath2, '{"test": "value2"}')

      const result1 = createConfigFingerprint(filePath1)
      const result2 = createConfigFingerprint(filePath2)

      expect(result1.exists).toBe(true)
      expect(result2.exists).toBe(true)
      if (result1.exists && result2.exists) {
        expect(result1.hash).not.toBe(result2.hash)
      }
    })
  })

  describe('createAllConfigFingerprints', () => {
    test('should return fingerprints for all three scopes', () => {
      const result = createAllConfigFingerprints(testDir)

      expect(result).toHaveProperty('local')
      expect(result).toHaveProperty('project')
      expect(result).toHaveProperty('user')
    })

    test('should detect existing config files', () => {
      // Create a local config
      const pleasePath = join(testDir, '.please')
      mkdirSync(pleasePath, { recursive: true })
      writeFileSync(join(pleasePath, 'mcp.local.json'), '{}')

      const result = createAllConfigFingerprints(testDir)

      expect(result.local?.exists).toBe(true)
      expect(result.project?.exists).toBe(false) // Not created
    })
  })

  describe('getCliVersion', () => {
    test('should return a version string', () => {
      const version = getCliVersion()

      // Should be either a semver-like string or 'unknown'
      expect(typeof version).toBe('string')
      expect(version.length).toBeGreaterThan(0)
    })

    test('should return consistent version on multiple calls', () => {
      const version1 = getCliVersion()
      const version2 = getCliVersion()

      expect(version1).toBe(version2)
    })
  })
})
