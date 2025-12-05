/**
 * Index scope type definitions for scope-based index storage
 */

/**
 * Available index storage scopes (source of truth)
 */
export const INDEX_SCOPES = ['project', 'user'] as const

/**
 * Index storage scope
 * - 'project': Project-level index at {cwd}/.please/mcp/index.json
 * - 'user': User-level index at ~/.please/mcp/index.json
 */
export type IndexScope = typeof INDEX_SCOPES[number]

/**
 * Available CLI scopes including 'all' for operations spanning both scopes
 */
export const CLI_SCOPES = [...INDEX_SCOPES, 'all'] as const

/**
 * CLI scope option that includes 'all' for operations spanning both scopes
 */
export type CliScope = typeof CLI_SCOPES[number]

/**
 * Type guard to check if a value is a valid IndexScope
 */
export function isIndexScope(value: unknown): value is IndexScope {
  return INDEX_SCOPES.includes(value as IndexScope)
}

/**
 * Type guard to check if a value is a valid CliScope
 */
export function isCliScope(value: unknown): value is CliScope {
  return CLI_SCOPES.includes(value as CliScope)
}
