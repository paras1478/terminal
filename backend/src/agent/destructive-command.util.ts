const DESTRUCTIVE_PATTERNS: RegExp[] = [
  /\brm\s+-[a-z]*r[a-z]*f\b/i,
  /\brm\s+-[a-z]*f[a-z]*r\b/i,
  /\brmdir\s+\/s\b/i,
  /\bdel\s+\/[sf]\b/i,
  /\bremove-item\b.*-recurse/i,
  /\bgit\s+reset\s+--hard\b/i,
  /\bgit\s+push\s+--force\b/i,
  /\bgit\s+clean\s+-[a-z]*f/i,
  /\bgit\s+branch\s+-D\b/i,
  /\bdrop\s+(database|table|collection)\b/i,
  /\bdb\.dropdatabase\b/i,
  /\btruncate\s+table\b/i,
  /\bdeleteMany\s*\(\s*\)/i,
  /\bnpm\s+uninstall\b/i,
  /\byarn\s+remove\b/i,
  /\bdocker\s+system\s+prune\b/i,
  /\bdocker-compose\s+down\s+-v\b/i,
  /\bterraform\s+destroy\b/i,
  /\bkubectl\s+delete\b/i,
  /\b(vercel|netlify)\s+deploy\s+--prod\b/i,
  /\bnpm\s+run\s+deploy\b/i,
];

export function isDestructiveCommand(command: string): boolean {
  return DESTRUCTIVE_PATTERNS.some((pattern) => pattern.test(command));
}
