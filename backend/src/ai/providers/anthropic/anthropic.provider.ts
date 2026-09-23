import { Injectable, Logger } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import {
  AiGenerateRequest,
  AiGenerateResult,
  AiProvider,
  AiToolCall,
} from '../provider.interface';

const MAX_OUTPUT_TOKENS = 4096;

@Injectable()
export class AnthropicProvider implements AiProvider {
  readonly id = 'anthropic' as const;
  private readonly logger = new Logger(AnthropicProvider.name);

  isConfigured(apiKey: string | undefined): boolean {
    return Boolean(apiKey);
  }

  async validateApiKey(apiKey: string): Promise<{ valid: boolean; message?: string }> {
    try {
      const client = new Anthropic({ apiKey });
      await client.models.list();
      return { valid: true };
    } catch (err) {
      this.logger.warn(`Anthropic key validation failed: ${(err as Error).message}`);
      return { valid: false, message: 'Anthropic rejected this API key.' };
    }
  }

  async generateResponse(apiKey: string, request: AiGenerateRequest): Promise<AiGenerateResult> {
    const client = new Anthropic({ apiKey });

    const tools = request.tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      input_schema: tool.parameters as Anthropic.Tool.InputSchema,
    }));

    const messages: Anthropic.MessageParam[] = [];
    for (const message of request.messages) {
      if (message.role === 'user') {
        messages.push({ role: 'user', content: message.content });
      } else if (message.role === 'assistant') {
        const blocks: Anthropic.ContentBlockParam[] = [];
        if (message.content) {
          blocks.push({ type: 'text', text: message.content });
        }
        for (const call of message.toolCalls ?? []) {
          const input = JSON.parse(call.arguments || '{}') as Record<string, unknown>;
          blocks.push({ type: 'tool_use', id: call.id, name: call.name, input });
        }
        messages.push({ role: 'assistant', content: blocks });
      } else {
        messages.push({
          role: 'user',
          content: [{ type: 'tool_result', tool_use_id: message.toolCallId, content: message.content }],
        });
      }
    }

    const response = await client.messages.create({
      model: request.model,
      max_tokens: MAX_OUTPUT_TOKENS,
      system: request.systemPrompt,
      tools,
      messages,
    });

    let text = '';
    const toolCalls: AiToolCall[] = [];
    for (const block of response.content) {
      if (block.type === 'text') {
        text += block.text;
      } else if (block.type === 'tool_use') {
        toolCalls.push({ id: block.id, name: block.name, arguments: JSON.stringify(block.input ?? {}) });
      }
    }

    return { text: text.trim(), toolCalls };
  }
}
