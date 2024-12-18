import Fastify from 'fastify';
import cors from '@fastify/cors';
import { readFileSync, writeFileSync } from 'fs';
import { translate } from '../src/services/translation';

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

interface Settings {
  OPENAI_API_KEY: string;
  ANTHROPIC_API_KEY: string;
  GOOGLE_SERVICE_ACCOUNT: string;
}

// Read settings from settings.json
function readSettings(): Settings {
  try {
    const content = readFileSync('settings.json', 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Failed to read settings:', error);
    return {
      OPENAI_API_KEY: '',
      ANTHROPIC_API_KEY: '',
      GOOGLE_SERVICE_ACCOUNT: '',
    };
  }
}

// Write settings to settings.json
function writeSettings(settings: Settings) {
  try {
    writeFileSync('settings.json', JSON.stringify(settings, null, 2));
  } catch (error) {
    console.error('Failed to write settings:', error);
    throw new Error('settings.errors.saveFailed');
  }
}

// Initialize settings
let settings = readSettings();

const fastify = Fastify({
  logger: false
});

await fastify.register(cors, {
  origin: 'http://localhost:5173'
});

interface TranslateBody {
  text: string;
  targetLang: { code: string; name: string };
  model: { id: string; name: string; chunkSize: number };
}

// Translation endpoint
fastify.post('/api/translate', async (request, reply) => {
  try {
    const { text, targetLang, model } = request.body as TranslateBody;

    if (!text) {
      throw new Error('translation.errors.emptyText');
    }

    let googleProjectId = '';
    let googleCredentials: GoogleServiceAccountCredentials | undefined;

    // Only validate Google credentials if Google model is selected
    if (model.id === 'google') {
      if (!settings.GOOGLE_SERVICE_ACCOUNT) {
        throw new Error('settings.errors.googleServiceAccountNotSet');
      }

      try {
        googleCredentials = JSON.parse(settings.GOOGLE_SERVICE_ACCOUNT);
        googleProjectId = googleCredentials.project_id;
        
        if (!googleProjectId || !googleCredentials.private_key || !googleCredentials.client_email) {
          throw new Error('settings.errors.missingGoogleFields');
        }
      } catch (error) {
        throw new Error('settings.errors.invalidGoogleKey');
      }
    }

    const translation = await translate(text, targetLang, model, {
      openaiKey: settings.OPENAI_API_KEY,
      anthropicKey: settings.ANTHROPIC_API_KEY,
      googleProjectId: googleProjectId || '',
      googleCredentials: googleCredentials || ''
    });

    return { translation };
  } catch (error) {
    console.error('Translation error:', error);
    reply.status(500).send({
      error: error instanceof Error ? error.message : 'translation.errors.unknown'
    });
  }
});

// API key management endpoints
fastify.get('/api/settings', async () => {
  return {
    settings,
    hasOpenAIKey: !!settings.OPENAI_API_KEY,
    hasAnthropicKey: !!settings.ANTHROPIC_API_KEY,
    hasGoogleKey: !!settings.GOOGLE_SERVICE_ACCOUNT
  };
});

fastify.post('/api/settings', async (request, reply) => {
  const { openaiKey, anthropicKey, googleKey } = request.body as {
    openaiKey?: string;
    anthropicKey?: string;
    googleKey?: string;
  };

  try {
    const newSettings = { ...settings };
    if (openaiKey !== undefined) newSettings.OPENAI_API_KEY = openaiKey;
    if (anthropicKey !== undefined) newSettings.ANTHROPIC_API_KEY = anthropicKey;
    if (googleKey !== undefined) {
      if (googleKey.trim() === '') {
        // If empty string, just set it without validation
        newSettings.GOOGLE_SERVICE_ACCOUNT = '';
      } else {
        // Validate Google service account JSON only if not empty
        try {
          const credentials: GoogleServiceAccountCredentials = JSON.parse(googleKey);
          if (!credentials.project_id || !credentials.private_key || !credentials.client_email) {
            throw new Error('settings.errors.missingGoogleFields');
          }
          newSettings.GOOGLE_SERVICE_ACCOUNT = googleKey;
        } catch (error) {
          if (error instanceof Error && error.message === 'settings.errors.missingGoogleFields') {
            throw error;
          }
          throw new Error('settings.errors.invalidGoogleKey');
        }
      }
    }

    // Save to file first to ensure it works
    writeSettings(newSettings);
    // Then update in-memory settings
    settings = newSettings;

    return { success: true, settings: newSettings };
  } catch (error) {
    console.error('Failed to update settings:', error);
    reply.status(500).send({
      error: error instanceof Error ? error.message : 'settings.errors.failedToUpdateSettings'
    });
  }
});

// Start server
try {
  await fastify.listen({ port: 3000 });
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
} 