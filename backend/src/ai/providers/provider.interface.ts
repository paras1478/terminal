import { AiProviderId } from '../model-catalog';

/** Provider-agnostic tool schema, shared by every provider implementation. */
export interface AiToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface AiToolCall {
  id: string;
  name: string;
  arguments: string;
}

/** One turn of conversation history, in a shape every provider can translate to/from its own wire format. */
export type AiMessage =
  | { role: 'user'; content: string }
  | { role: 'assistant'; content: string; toolCalls?: AiToolCall[] }
  | { role: 'tool'; toolCallId: string; content: string };

export interface AiGenerateRequest {
  model: string;
  systemPrompt: string;
  tools: AiToolDefinition[];
  messages: AiMessage[];
}

export interface AiGenerateResult {
  text: string;
  toolCalls: AiToolCall[];
}

/**
 * Common interface every AI provider (OpenAI, Anthropic, Google) must implement.
 * AgentService talks only to this interface, never to a provider SDK directly,
 * so switching the user's selected model/provider requires no changes to the
 * agent's tool-execution loop.
 */
export interface AiProvider {
  readonly id: AiProviderId;

  /** Whether an API key has been supplied for this provider (does not verify the key is valid). */
  isConfigured(apiKey: string | undefined): boolean;

  /** Performs a real, minimal API call to confirm the key is accepted by the provider. */
  validateApiKey(apiKey: string): Promise<{ valid: boolean; message?: string }>;

  /** Runs one model turn and returns its text output plus any requested tool calls. */
  generateResponse(apiKey: string, request: AiGenerateRequest): Promise<AiGenerateResult>;
}
