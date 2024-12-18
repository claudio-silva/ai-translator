import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { TranslationServiceClient } from '@google-cloud/translate';
import { protos } from '@google-cloud/translate';
import { Language, TranslationModel, MODELS } from '../types';

type TranslateTextRequest = protos.google.cloud.translation.v3.ITranslateTextRequest;

interface GoogleServiceAccountCredentials {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
  universe_domain: string;
}

// Helper function to get chunk size for a model
function getChunkSize(modelId: string): number {
  const model = MODELS.find(m => m.id === modelId);
  if (!model) {
    throw new Error(`Unknown model: ${modelId}`);
  }
  return model.chunkSize;
}

// Helper function to split text into chunks while respecting paragraph boundaries
export function splitTextIntoChunks(text: string, maxChunkSize: number): string[] {
  const paragraphs = text.split(/\n\n+/);
  const chunks: string[] = [];
  let currentChunk = '';

  for (const paragraph of paragraphs) {
    // If adding this paragraph would exceed chunk size, start a new chunk
    if (currentChunk && (currentChunk.length + paragraph.length + 2) > maxChunkSize) {
      chunks.push(currentChunk.trim());
      currentChunk = '';
    }
    
    // If a single paragraph is larger than maxChunkSize, we might need to split it
    // (but try to avoid this if possible as it breaks paragraph coherence)
    if (paragraph.length > maxChunkSize) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }
      // Split long paragraph at sentence boundaries if possible
      const sentences = paragraph.match(/[^.!?]+[.!?]+/g) || [paragraph];
      let sentenceChunk = '';
      for (const sentence of sentences) {
        if ((sentenceChunk.length + sentence.length) > maxChunkSize) {
          if (sentenceChunk) chunks.push(sentenceChunk.trim());
          sentenceChunk = sentence;
        } else {
          sentenceChunk += sentence;
        }
      }
      if (sentenceChunk) chunks.push(sentenceChunk.trim());
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

const TRANSLATION_PROMPT = (targetLang: Language, text: string) => 
  `Translate the following text to ${targetLang.name} (${targetLang.code}). 
Be faithful to the original text and preserve all line breaks and symbols (like quotes, dashes, etc.).
Provide only the translation - nothing else!

Text to translate:
${text}`;

// Main translation function
export async function translate(
  text: string,
  targetLang: Language,
  model: TranslationModel,
  settings: {
    openaiKey: string;
    anthropicKey: string;
    googleProjectId: string;
    googleCredentials: GoogleServiceAccountCredentials | string;
  }
): Promise<string> {
  // Initialize the appropriate client based on the selected model
  let openaiClient: OpenAI;
  let anthropicClient: Anthropic;
  let googleClient: TranslationServiceClient;

  // Initialize the required client for the selected model
  switch (model.id) {
    case 'gpt4':
      if (!settings.openaiKey) {
        throw new Error('settings.errors.openaiKeyNotSet');
      }
      openaiClient = new OpenAI({ apiKey: settings.openaiKey });
      break;

    case 'claude':
      if (!settings.anthropicKey) {
        throw new Error('settings.errors.anthropicKeyNotSet');
      }
      anthropicClient = new Anthropic({ apiKey: settings.anthropicKey });
      break;

    case 'google':
      if (!settings.googleProjectId || !settings.googleCredentials) {
        throw new Error('settings.errors.googleConfigNotSet');
      }
      break;

    default:
      throw new Error('settings.errors.unsupportedModel');
  }

  const chunks = splitTextIntoChunks(text, getChunkSize(model.id));
  const translatedChunks: string[] = [];

  for (const chunk of chunks) {
    let translatedChunk = '';

    switch (model.id) {
      case 'gpt4': {
        const response = await openaiClient.chat.completions.create({
          model: 'gpt-4o',
          messages: [{ role: 'user', content: TRANSLATION_PROMPT(targetLang, chunk) }],
          temperature: 0.3,
        });
        translatedChunk = response.choices[0]?.message?.content || '';
        break;
      }

      case 'claude': {
        const claudeResponse = await anthropicClient.messages.create({
          model: 'claude-3-sonnet-20240229',
          max_tokens: 4000,
          temperature: 0.3,
          messages: [{ role: 'user', content: TRANSLATION_PROMPT(targetLang, chunk) }],
        });

        const content = claudeResponse.content[0];
        if (!content || typeof content !== 'object' || !('text' in content)) {
          throw new Error('Unexpected response format from Claude API');
        }
        translatedChunk = content.text;
        break;
      }

      case 'google': {
        if (typeof settings.googleCredentials === 'string') {
          try {
            const credentials = JSON.parse(settings.googleCredentials);
            googleClient = new TranslationServiceClient({
              projectId: settings.googleProjectId,
              credentials
            });
          } catch (e) {
            throw new Error('settings.errors.invalidGoogleKey');
          }
        } else {
          googleClient = new TranslationServiceClient({
            projectId: settings.googleProjectId,
            credentials: settings.googleCredentials
          });
        }
        const request: TranslateTextRequest = {
          parent: `projects/${settings.googleProjectId}/locations/global`,
          contents: [chunk],
          mimeType: 'text/plain',
          targetLanguageCode: targetLang.code,
        };

        const [googleResponse] = await googleClient.translateText(request);
        if (!googleResponse.translations?.[0]?.translatedText) {
          throw new Error('No translation received from Google Translate');
        }
        translatedChunk = googleResponse.translations[0].translatedText;
        break;
      }
    }

    translatedChunks.push(translatedChunk);
  }

  return translatedChunks.join('\n\n');
} 