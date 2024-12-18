export type Language = {
  code: string;
  name: string;
};

export type TranslationModel = {
  id: string;
  name: string;
  chunkSize: number;
};

export interface Settings {
  openaiKey: string;
  anthropicKey: string;
  googleKey: string;
  interfaceLanguage: string;
}

export const LANGUAGES: Language[] = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt-PT', name: 'Portuguese (European)' }
];

export const INTERFACE_LANGUAGES = LANGUAGES;

export const MODELS: TranslationModel[] = [
  { id: 'gpt4', name: 'GPT-4o', chunkSize: 1000 },
  { id: 'claude', name: 'Claude', chunkSize: 1000 },
  { id: 'google', name: 'Google Translate', chunkSize: 20000 },
];

export type InterfaceLanguage = typeof INTERFACE_LANGUAGES[number]['code']; 