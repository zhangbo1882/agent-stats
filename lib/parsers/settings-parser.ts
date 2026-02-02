import { Settings } from '../types';

export function parseSettings(settingsData: any): Settings {
  // Pass all fields, including potential future fields
  return {
    ...settingsData,
    env: settingsData.env || {},
    enabledPlugins: settingsData.enabledPlugins || {},
  };
}

export function sanitizeApiKey(apiKey: string): string {
  if (!apiKey || apiKey.length < 8) {
    return '***';
  }
  return `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`;
}

export function getApiBaseUrl(settings: Settings): string {
  return settings.env?.ANTHROPIC_BASE_URL || 'https://api.anthropic.com';
}

export function getApiTimeout(settings: Settings): number {
  return parseInt(settings.env?.API_TIMEOUT_MS || '120000', 10);
}

export function getModelName(settings: Settings): string | null {
  if (!settings.env) return null;
  for (const key in settings.env) {
    if (key.toUpperCase().includes('MODEL') && settings.env[key]) {
      return settings.env[key];
    }
  }
  return null;
}
