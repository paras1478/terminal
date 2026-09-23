import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiProviderId, getProviderForModel } from './model-catalog';
import { AiProvider } from './providers/provider.interface';
import { OpenAiProvider } from './providers/openai/openai.provider';
import { AnthropicProvider } from './providers/anthropic/anthropic.provider';
import { GoogleProvider } from './providers/google/google.provider';

export class AiProviderError extends Error {
  constructor(
    message: string,
    public readonly code: 'unknown_model' | 'missing_api_key' | 'invalid_api_key' | 'provider_unavailable',
  ) {
    super(message);
  }
}

/**
 * Resolves a user's chosen model to its provider, and supplies the correct
 * API key for that provider: the user's own stored key
 * (UserSettings.apiKeys[provider]) takes priority, falling back to a
 * system-wide env var (only OPENAI_API_KEY exists today) so existing
 * deployments keep working without every user having to configure a key.
 */
@Injectable()
export class ProviderRegistryService {
  private readonly providers: Record<AiProviderId, AiProvider>;

  constructor(
    private readonly config: ConfigService,
    openai: OpenAiProvider,
    anthropic: AnthropicProvider,
    google: GoogleProvider,
  ) {
    this.providers = { openai, anthropic, google };
  }

  getProvider(providerId: AiProviderId): AiProvider {
    return this.providers[providerId];
  }

  resolveApiKey(providerId: AiProviderId, userApiKeys: Record<string, string>): string | undefined {
    const userKey = userApiKeys[providerId];
    if (userKey) return userKey;

    if (providerId === 'openai') {
      const envKey = this.config.get<string>('OPENAI_API_KEY');
      return envKey && envKey !== 'your_openai_api_key_here' ? envKey : undefined;
    }
    return undefined;
  }

  /** Resolves the model the user selected to its provider + API key, or throws a typed, user-facing error. */
  resolve(
    modelId: string,
    userApiKeys: Record<string, string>,
  ): { provider: AiProvider; apiKey: string; providerId: AiProviderId } {
    const providerId = getProviderForModel(modelId);
    if (!providerId) {
      throw new AiProviderError(`"${modelId}" is not a recognized model.`, 'unknown_model');
    }

    const provider = this.getProvider(providerId);
    const apiKey = this.resolveApiKey(providerId, userApiKeys);
    if (!apiKey) {
      throw new AiProviderError(
        `No API key configured for ${providerId}. Add one in Settings > API Keys.`,
        'missing_api_key',
      );
    }
    if (!provider.isConfigured(apiKey)) {
      throw new AiProviderError(`${providerId} is not properly configured.`, 'provider_unavailable');
    }

    return { provider, apiKey, providerId };
  }
}
