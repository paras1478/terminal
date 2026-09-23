import { Module } from '@nestjs/common';
import { OpenAiProvider } from './providers/openai/openai.provider';
import { AnthropicProvider } from './providers/anthropic/anthropic.provider';
import { GoogleProvider } from './providers/google/google.provider';
import { ProviderRegistryService } from './provider-registry.service';

@Module({
  providers: [OpenAiProvider, AnthropicProvider, GoogleProvider, ProviderRegistryService],
  exports: [ProviderRegistryService, OpenAiProvider, AnthropicProvider, GoogleProvider],
})
export class AiModule {}
