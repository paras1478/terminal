import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import type {
  FunctionTool,
  ResponseFunctionToolCall,
  ResponseInputItem,
} from 'openai/resources/responses/responses';
import {
  AiGenerateRequest,
  AiGenerateResult,
  AiProvider,
} from '../provider.interface';

@Injectable()
export class OpenAiProvider implements AiProvider {
  readonly id = 'openai' as const;
  private readonly logger = new Logger(OpenAiProvider.name);

  isConfigured(apiKey: string | undefined): boolean {
    return Boolean(apiKey && apiKey !== 'your_openai_api_key_here');
  }

  async validateApiKey(apiKey: string): Promise<{ valid: boolean; message?: string }> {
    try {
      const client = new OpenAI({ apiKey });
      await client.models.list();
      return { valid: true };
    } catch (err) {
      this.logger.warn(`OpenAI key validation failed: ${(err as Error).message}`);
      return { valid: false, message: 'OpenAI rejected this API key.' };
    }
  }

  async generateResponse(apiKey: string, request: AiGenerateRequest): Promise<AiGenerateResult> {
    const client = new OpenAI({ apiKey });

    const tools: FunctionTool[] = request.tools.map((tool) => ({
      type: 'function',
      name: tool.name,
      description: tool.description,
      strict: false,
      parameters: tool.parameters,
    }));

    const input: ResponseInputItem[] = [];
    for (const message of request.messages) {
      if (message.role === 'user') {
        input.push({ role: 'user', content: message.content });
      } else if (message.role === 'assistant') {
        if (message.content) {
          input.push({ role: 'assistant', content: message.content });
        }
        for (const call of message.toolCalls ?? []) {
          input.push({
            type: 'function_call',
            call_id: call.id,
            name: call.name,
            arguments: call.arguments,
          });
        }
      } else {
        input.push({
          type: 'function_call_output',
          call_id: message.toolCallId,
          output: message.content,
        });
      }
    }

    const response = await client.responses.create({
      model: request.model,
      instructions: request.systemPrompt,
      tools,
      input,
    });

    const toolCalls = response.output
      .filter((item): item is ResponseFunctionToolCall => item.type === 'function_call')
      .map((call) => ({ id: call.call_id, name: call.name, arguments: call.arguments }));

    return { text: response.output_text?.trim() ?? '', toolCalls };
  }
}
