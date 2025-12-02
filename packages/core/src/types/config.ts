import type { SearchMode } from './tool.js';

/**
 * Embedding provider types
 */
export type EmbeddingProviderType = 'local' | 'openai' | 'voyage';

/**
 * Embedding provider configuration
 */
export interface EmbeddingProviderConfig {
  type: EmbeddingProviderType;
  model?: string;
  apiKey?: string;
  apiBase?: string;
  dimensions?: number;
  options?: Record<string, unknown>;
}

/**
 * Index configuration
 */
export interface IndexConfig {
  name: string;
  toolSources: string[];
  embeddingProvider?: EmbeddingProviderConfig;
  outputPath: string;
}

/**
 * Server configuration
 */
export interface ServerConfig {
  transport: 'stdio' | 'http';
  port?: number;
  indexPath: string;
  defaultMode: SearchMode;
  embeddingProvider?: EmbeddingProviderConfig;
}

/**
 * Application configuration
 */
export interface AppConfig {
  defaultSearchMode: SearchMode;
  defaultTopK: number;
  indexPath: string;
  embeddingProvider: EmbeddingProviderConfig;
  server?: {
    transport: 'stdio' | 'http';
    port?: number;
  };
}
