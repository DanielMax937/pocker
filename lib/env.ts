import { readFileSync } from 'fs';
import { resolve } from 'path';

/**
 * Load .env.local and force its values into process.env.
 * This ensures .env.local takes precedence over shell environment variables,
 * which is the opposite of Next.js default behavior.
 */
export function loadEnvLocal(): void {
  try {
    const content = readFileSync(resolve(process.cwd(), '.env.local'), 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIndex = trimmed.indexOf('=');
      if (eqIndex === -1) continue;
      const key = trimmed.slice(0, eqIndex);
      const val = trimmed.slice(eqIndex + 1);
      // Force .env.local values — override shell env
      process.env[key] = val;
    }
  } catch {
    // .env.local not found, that's fine
  }
}
