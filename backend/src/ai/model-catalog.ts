/**
 * Single source of truth for supported AI providers/models. Backend validation
 * (UpdateSettingsDto), the provider registry, and the frontend model dropdown
 * all read from this list (frontend via a mirrored copy in
 * frontend/src/lib/ai/model-catalog.ts, since Next.js cannot import backend
 * source directly) so there is exactly one place to add a new model.
 */

export type AiProviderId = 'openai' | 'anthropic' | 'google';

export interface AiModelInfo {
  id: string;
  provider: AiProviderId;
  label: string;
}

export const AI_PROVIDERS: { id: AiProviderId; label: string }[] = [
  { id: 'openai', label: 'OpenAI' },
  { id: 'anthropic', label: 'Anthropic' },
  { id: 'google', label: 'Google Gemini' },
];

export const AI_MODELS: AiModelInfo[] = [
  { id: 'gpt-5.1', provider: 'openai', label: 'GPT-5.1' },
  { id: 'gpt-5.1-mini', provider: 'openai', label: 'GPT-5.1 Mini' },
  { id: 'claude-opus-5', provider: 'anthropic', label: 'Claude Opus 5' },
  { id: 'claude-sonnet-5', provider: 'anthropic', label: 'Claude Sonnet 5' },
  { id: 'claude-haiku-4-5-20251001', provider: 'anthropic', label: 'Claude Haiku 4.5' },
  { id: 'gemini-2.5-pro', provider: 'google', label: 'Gemini 2.5 Pro' },
  { id: 'gemini-2.5-flash', provider: 'google', label: 'Gemini 2.5 Flash' },
];

export const ALLOWED_MODEL_IDS = AI_MODELS.map((m) => m.id);

export function getModelInfo(modelId: string): AiModelInfo | undefined {
  return AI_MODELS.find((m) => m.id === modelId);
}

export function getProviderForModel(modelId: string): AiProviderId | undefined {
  return getModelInfo(modelId)?.provider;
}
