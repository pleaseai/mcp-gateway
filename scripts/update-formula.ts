#!/usr/bin/env bun

/**
 * Update Homebrew formula with new version and checksums.
 *
 * Usage:
 *   bun scripts/update-formula.ts <version> <tag> <homebrew-tap-path>
 *
 * Example:
 *   bun scripts/update-formula.ts 0.2.4-beta.1 mcp-v0.2.4-beta.1 ../homebrew-tap
 */

import { existsSync } from 'node:fs'
import { join } from 'node:path'
import process from 'node:process'

const REPO = 'pleaseai/mcp-gateway'

interface Checksums {
  darwinX64: string
  darwinArm64: string
  linuxX64: string
  linuxArm64: string
}

async function downloadChecksum(tag: string, platform: string): Promise<string> {
  const url = `https://github.com/${REPO}/releases/download/${tag}/mcp-gateway-${platform}.sha256`
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Failed to download checksum for ${platform}: ${response.statusText}`)
  }

  const content = await response.text()
  const checksum = content.split(/\s+/)[0]

  // Validate SHA256 format (64 hex characters)
  if (!/^[a-f0-9]{64}$/i.test(checksum)) {
    throw new Error(
      `Invalid checksum for ${platform}: expected 64 hex chars, got "${checksum.slice(0, 20)}${checksum.length > 20 ? '...' : ''}"`,
    )
  }

  return checksum
}

async function downloadChecksums(tag: string): Promise<Checksums> {
  console.log('Downloading checksums...')

  const [darwinX64, darwinArm64, linuxX64, linuxArm64] = await Promise.all([
    downloadChecksum(tag, 'darwin-x64'),
    downloadChecksum(tag, 'darwin-arm64'),
    downloadChecksum(tag, 'linux-x64'),
    downloadChecksum(tag, 'linux-arm64'),
  ])

  console.log('Checksums:')
  console.log(`  darwin-x64:   ${darwinX64.slice(0, 16)}...`)
  console.log(`  darwin-arm64: ${darwinArm64.slice(0, 16)}...`)
  console.log(`  linux-x64:    ${linuxX64.slice(0, 16)}...`)
  console.log(`  linux-arm64:  ${linuxArm64.slice(0, 16)}...`)

  return { darwinX64, darwinArm64, linuxX64, linuxArm64 }
}

function generateFormula(version: string, tag: string, checksums: Checksums): string {
  return `class McpGateway < Formula
  desc "MCP server and CLI for searching tools using regex, BM25, or semantic search"
  homepage "https://github.com/pleaseai/mcp-gateway"
  version "${version}"
  license "MIT"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/pleaseai/mcp-gateway/releases/download/${tag}/mcp-gateway-darwin-arm64"
      sha256 "${checksums.darwinArm64}"
    else
      url "https://github.com/pleaseai/mcp-gateway/releases/download/${tag}/mcp-gateway-darwin-x64"
      sha256 "${checksums.darwinX64}"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/pleaseai/mcp-gateway/releases/download/${tag}/mcp-gateway-linux-arm64"
      sha256 "${checksums.linuxArm64}"
    else
      url "https://github.com/pleaseai/mcp-gateway/releases/download/${tag}/mcp-gateway-linux-x64"
      sha256 "${checksums.linuxX64}"
    end
  end

  def install
    if OS.mac?
      if Hardware::CPU.arm?
        bin.install "mcp-gateway-darwin-arm64" => "mcp-gateway"
      else
        bin.install "mcp-gateway-darwin-x64" => "mcp-gateway"
      end
    else
      if Hardware::CPU.arm?
        bin.install "mcp-gateway-linux-arm64" => "mcp-gateway"
      else
        bin.install "mcp-gateway-linux-x64" => "mcp-gateway"
      end
    end
  end

  test do
    assert_match version.to_s, shell_output("\#{bin}/mcp-gateway --version")
  end
end
`
}

function usage(): never {
  console.log('Usage: bun scripts/update-formula.ts <version> <tag> <homebrew-tap-path>')
  console.log('')
  console.log('Arguments:')
  console.log('  version           Release version (e.g., 0.2.4-beta.1)')
  console.log('  tag               Git tag for release (e.g., mcp-v0.2.4-beta.1)')
  console.log('  homebrew-tap-path Path to homebrew-tap repository')
  process.exit(1)
}

async function main() {
  const args = process.argv.slice(2)

  if (args.length < 3) {
    usage()
  }

  const version = args[0]
  const tag = args[1]
  const tapPath = args[2]

  // Validate version format (supports prerelease suffixes like -beta.1)
  if (!/^\d+\.\d+\.\d+(?:-[\w.]+)?$/.test(version)) {
    console.error(`ERROR: Invalid version format: ${version}`)
    process.exit(1)
  }

  // Validate tag format
  if (!/^[a-z]+-v\d+\.\d+\.\d+(?:-[\w.]+)?$/.test(tag)) {
    console.error(`ERROR: Invalid tag format: ${tag}`)
    process.exit(1)
  }

  // Validate tap path
  if (!existsSync(tapPath)) {
    console.error(`ERROR: Homebrew tap path does not exist: ${tapPath}`)
    process.exit(1)
  }

  console.log(`Updating formula for version ${version} (tag: ${tag})`)

  const checksums = await downloadChecksums(tag)
  const formula = generateFormula(version, tag, checksums)

  const formulaPath = join(tapPath, 'mcp-gateway.rb')
  await Bun.write(formulaPath, formula)

  console.log(`Formula updated: ${formulaPath}`)
  console.log('Done!')
}

main().catch((err) => {
  console.error('Failed:', err.message)
  process.exit(1)
})
