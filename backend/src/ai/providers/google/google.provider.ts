import { Injectable, Logger } from '@nestjs/common';
import {
  FunctionDeclarationSchema,
  GoogleGenerativeAI,
  Part,
} from '@google/generative-ai';
import {
  AiGenerateRequest,
  AiGenerateResult,
  AiProvider,
  AiToolCall,
} from '../provider.interface';

@Injectable()
export class GoogleProvider implements AiProvider {
  readonly id = 'google' as const;
  private readonly logger = new Logger(GoogleProvider.name);

  isConfigured(apiKey: string | undefined): boolean {
    return Boolean(apiKey);
  }

  async validateApiKey(apiKey: string): Promise<{ valid: boolean; message?: string }> {
    try {
      const client = new GoogleGenerativeAI(apiKey);
      const model = client.getGenerativeModel({ model: 'gemini-2.5-flash' });
      await model.generateContent('ping');
      return { valid: true };
    } catch (err) {
      this.logger.warn(`Google key validation failed: ${(err as Error).message}`);
      return { valid: false, message: 'Google rejected this API key.' };
    }
  }

  async generateResponse(apiKey: string, request: AiGenerateRequest): Promise<AiGenerateResult> {
    const client = new GoogleGenerativeAI(apiKey);
    const model = client.getGenerativeModel({
      model: request.model,
      systemInstruction: request.systemPrompt,
      tools: [
        {
          functionDeclarations: request.tools.map((tool) => ({
            name: tool.name,
            description: tool.description,
            parameters: tool.parameters as unknown as FunctionDeclarationSchema,
          })),
        },
      ],
    });

    const history: { role: 'user' | 'model'; parts: Part[] }[] = [];
    for (const message of request.messages) {
      if (message.role === 'user') {
        history.push({ role: 'user', parts: [{ text: message.content }] });
      } else if (message.role === 'assistant') {
        const parts: Part[] = [];
        if (message.content) {
          parts.push({ text: message.content });
        }
        for (const call of message.toolCalls ?? []) {
          const args = JSON.parse(call.arguments || '{}') as Record<string, unknown>;
          parts.push({ functionCall: { name: call.name, args } });
        }
        history.push({ role: 'model', parts });
      } else {
        history.push({
          role: 'user',
          parts: [
            {
              functionResponse: {
                name: message.toolCallId,
                response: { result: message.content },
              },
            },
          ],
        });
      }
    }

    const last = history.pop();
    const chat = model.startChat({ history });
    const result = await chat.sendMessage(last?.parts ?? []);
    const response = result.response;

    const text = response.text() ?? '';
    const toolCalls: AiToolCall[] = (response.functionCalls() ?? []).map((call, index) => ({
      id: `${call.name}-${index}-${Date.now()}`,
      name: call.name,
      arguments: JSON.stringify(call.args ?? {}),
    }));

    return { text: text.trim(), toolCalls };
  }
}
