import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { AI_PROVIDERS } from '../../ai/model-catalog';

const ALLOWED_PROVIDERS = new Set(AI_PROVIDERS.map((p) => p.id));
const MAX_KEY_LENGTH = 512;

@ValidatorConstraint({ name: 'isValidApiKeyMap', async: false })
class IsValidApiKeyMapConstraint implements ValidatorConstraintInterface {
  private lastError = 'apiKeys must be a map of provider name to key string.';

  validate(value: unknown): boolean {
    if (value === undefined || value === null) return true;
    if (typeof value !== 'object' || Array.isArray(value)) {
      this.lastError = 'apiKeys must be an object.';
      return false;
    }
    for (const [provider, key] of Object.entries(value as Record<string, unknown>)) {
      if (!ALLOWED_PROVIDERS.has(provider as never)) {
        this.lastError = `Unknown provider "${provider}". Allowed: ${[...ALLOWED_PROVIDERS].join(', ')}.`;
        return false;
      }
      if (typeof key !== 'string' || key.trim().length === 0) {
        this.lastError = `API key for "${provider}" must be a non-empty string.`;
        return false;
      }
      if (key.length > MAX_KEY_LENGTH) {
        this.lastError = `API key for "${provider}" is too long.`;
        return false;
      }
    }
    return true;
  }

  defaultMessage(): string {
    return this.lastError;
  }
}

export function IsValidApiKeyMap(options?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options,
      constraints: [],
      validator: IsValidApiKeyMapConstraint,
    });
  };
}
