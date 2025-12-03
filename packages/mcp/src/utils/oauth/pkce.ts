/**
 * PKCE (Proof Key for Code Exchange) implementation
 * RFC 7636 - S256 method
 */

import { createHash, randomBytes } from 'node:crypto'

export interface PKCEChallenge {
  verifier: string
  challenge: string
}

/**
 * Generate PKCE code verifier and challenge using S256 method
 */
export function generatePKCE(): PKCEChallenge {
  const verifier = randomBytes(32).toString('base64url')
  const challenge = createHash('sha256')
    .update(verifier)
    .digest('base64url')
  return { verifier, challenge }
}

/**
 * Generate random state parameter for CSRF protection
 */
export function generateState(): string {
  return randomBytes(16).toString('base64url')
}
