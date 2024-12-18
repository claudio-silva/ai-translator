import { promises as fs } from 'fs';
import path from 'path';

export interface TranslationSettings {
  openaiKey: string;
  anthropicKey: string;
  googleProjectId: string;
  googleCredentials: string;
}

class ConfigurationService {
  private settings: TranslationSettings = {
    openaiKey: '',
    anthropicKey: '',
    googleProjectId: '',
    googleCredentials: '',
  };

  private settingsPath = path.resolve(process.cwd(), 'settings.json');

  async loadSettings() {
    try {
      const data = await fs.readFile(this.settingsPath, 'utf8');
      this.settings = JSON.parse(data);
      console.log('Settings loaded successfully from:', this.settingsPath);
    } catch (error) {
      // If file doesn't exist or is invalid, use default empty settings
      console.log('No settings file found or invalid JSON, using default empty settings');
    }
  }

  async saveSettings(settings: TranslationSettings) {
    // Validate Google credentials only if they're provided
    if (settings.googleCredentials && settings.googleCredentials.trim() !== '') {
      try {
        const credentials = JSON.parse(settings.googleCredentials);
        if (!credentials.project_id || !credentials.private_key || !credentials.client_email) {
          throw new Error('Missing required fields in Google service account key');
        }
        settings.googleProjectId = credentials.project_id;
      } catch (error) {
        throw new Error(`Invalid Google service account key format: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    this.settings = settings;
    await fs.writeFile(this.settingsPath, JSON.stringify(settings, null, 2));
    console.log('Settings saved successfully to:', this.settingsPath);
  }

  getSettings(): TranslationSettings {
    return this.settings;
  }
}

// Export a singleton instance
export const configService = new ConfigurationService();