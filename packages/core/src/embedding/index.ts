import type { EmbeddingProvider } from './provider.js';
import type { EmbeddingProviderConfig, EmbeddingProviderType } from '../types/index.js';
import { LocalEmbeddingProvider } from './providers/local.js';
import { OpenAIEmbeddingProvider } from './providers/openai.js';
import { VoyageAIEmbeddingProvider } from './providers/voyage.js';

export { type EmbeddingProvider } from './provider.js';
export { LocalEmbeddingProvider } from './providers/local.js';
export { OpenAIEmbeddingProvider } from './providers/openai.js';
export { VoyageAIEmbeddingProvider } from './providers/voyage.js';

/**
 * Custom provider factory function type
 */
type ProviderFactory = (config: EmbeddingProviderConfig) => EmbeddingProvider;

/**
 * Registry for embedding providers
 */
export class EmbeddingProviderRegistry {
  private customProviders: Map<string, ProviderFactory>;

  constructor() {
    this.customProviders = new Map();
  }

  /**
   * Register a custom provider factory
   */
  register(type: string, factory: ProviderFactory): void {
    this.customProviders.set(type, factory);
  }

  /**
   * Create a provider from configuration
   */
  create(config: EmbeddingProviderConfig): EmbeddingProvider {
    // Check custom providers first
    const customFactory = this.customProviders.get(config.type);
    if (customFactory) {
      return customFactory(config);
    }

    // Built-in providers
    switch (config.type) {
      case 'local':
        return new LocalEmbeddingProvider(config.model);

      case 'openai':
        return new OpenAIEmbeddingProvider({
          model: config.model,
          apiKey: config.apiKey,
          apiBase: config.apiBase,
          dimensions: config.dimensions,
        });

      case 'voyage':
        return new VoyageAIEmbeddingProvider({
          model: config.model,
          apiKey: config.apiKey,
          apiBase: config.apiBase,
          dimensions: config.dimensions,
        });

      default:
        throw new Error(`Unknown embedding provider type: ${config.type}`);
    }
  }

  /**
   * Get available provider types
   */
  getAvailableTypes(): string[] {
    const builtIn: EmbeddingProviderType[] = ['local', 'openai', 'voyage'];
    const custom = Array.from(this.customProviders.keys());
    return [...builtIn, ...custom];
  }
}

/**
 * Default registry instance
 */
export const defaultRegistry = new EmbeddingProviderRegistry();

/**
 * Helper function to create a provider from config
 */
export function createEmbeddingProvider(config: EmbeddingProviderConfig): EmbeddingProvider {
  return defaultRegistry.create(config);
}
