import { Language, TranslationModel, Settings } from '../types';

const API_URL = 'http://localhost:3000/api';

export async function* translate(
  text: string,
  targetLang: Language,
  model: TranslationModel,
  signal?: AbortSignal
): AsyncGenerator<string> {
  // Split text into chunks based on model's chunkSize
  const chunks = text.split(/\n\s*\n/).reduce((acc: string[], paragraph) => {
    if (!acc.length) return [paragraph];
    
    const lastChunk = acc[acc.length - 1];
    if ((lastChunk + '\n\n' + paragraph).length <= model.chunkSize) {
      acc[acc.length - 1] = lastChunk + '\n\n' + paragraph;
    } else {
      acc.push(paragraph);
    }
    return acc;
  }, []);

  // Translate each chunk
  for (const chunk of chunks) {
    const response = await fetch(`${API_URL}/translate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: chunk,
        targetLang,
        model,
      }),
      signal,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Translation failed');
    }

    const data = await response.json();
    yield data.translation;
  }
}

export interface ServerSettings {
  OPENAI_API_KEY: string;
  ANTHROPIC_API_KEY: string;
  GOOGLE_SERVICE_ACCOUNT: string;
  interfaceLanguage: string;
}

interface SettingsResponse {
  settings: ServerSettings;
  hasOpenAIKey: boolean;
  hasAnthropicKey: boolean;
  hasGoogleKey: boolean;
}

export async function getSettings(): Promise<SettingsResponse> {
  const response = await fetch(`${API_URL}/settings`);
  if (!response.ok) {
    throw new Error('Failed to fetch settings');
  }
  return response.json();
}

export async function updateSettings(settings: Settings): Promise<{ success: boolean; settings: ServerSettings }> {
  const response = await fetch(`${API_URL}/settings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      openaiKey: settings.openaiKey,
      anthropicKey: settings.anthropicKey,
      googleKey: settings.googleKey,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to update settings');
  }

  return data;
}