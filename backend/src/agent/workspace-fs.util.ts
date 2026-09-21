import { BadRequestException } from '@nestjs/common';
import { resolve, relative, isAbsolute } from 'path';

const BLOCKED_SEGMENTS = ['.env', '.git/config', 'node_modules'];

export function resolveWithinWorkspace(workspaceRoot: string, targetPath: string): string {
  const resolvedRoot = resolve(workspaceRoot);
  const resolvedTarget = resolve(resolvedRoot, targetPath);
  const rel = relative(resolvedRoot, resolvedTarget);

  if (rel.startsWith('..') || isAbsolute(rel)) {
    throw new BadRequestException(
      `Path escapes workspace root: ${targetPath}`,
    );
  }

  return resolvedTarget;
}

export function isSecretLikePath(targetPath: string): boolean {
  const normalized = targetPath.replace(/\\/g, '/').toLowerCase();
  return (
    /(^|\/)\.env(\.|$)/.test(normalized) ||
    normalized.endsWith('.pem') ||
    normalized.endsWith('.key') ||
    /(^|\/)id_rsa$/.test(normalized) ||
    BLOCKED_SEGMENTS.some((segment) => normalized.includes(segment))
  );
}

export function redactSecrets(content: string): string {
  return content
    .replace(/([A-Za-z0-9_]*(SECRET|TOKEN|PASSWORD|API_KEY|ACCESS_KEY)[A-Za-z0-9_]*\s*=\s*)(.+)/gi, '$1••••••••')
    .replace(/(sk-[a-zA-Z0-9]{10,})/g, '••••••••')
    .replace(/(mongodb(?:\+srv)?:\/\/[^:]+:)([^@]+)(@)/gi, '$1••••••••$3');
}
