# AI Translator

A web application that translates text of any length, using multiple AI models.

## Description

Do you want to effortlessly compare translations from different AI models?
Frustrated with splitting your text into smaller chunks to avoid length limitations?
AI Translator is here to help!

With AI Translator, you can translate lengthy texts seamlessly using AI models from OpenAI, Anthropic, and Google, with your own API keys.
Install it on your computer and enjoy smooth, hassle-free translations.

## Features

- Support for multiple translation models:
  - GPT-4o
  - Claude Sonnet
  - Google Translate
- Support for multiple languages:
  - English
  - French
  - Spanish
  - German
  - Italian
  - Portuguese (European)
- Multilingual interface.
- Source language auto-detection.
- Automatic text chunking and streaming for large documents.
- Clean, modern UI with dark mode support.
- Copy to clipboard and file saving features.
- Settings dialog allows you to configure API keys and interface language.
- Single-user web application, with no authentication, meant to be run locally.

## Tech stack

- React
- TypeScript
- Vite
- Tailwind CSS
- Shadcn UI
- Fastify
- OpenAI SDK
- Anthropic AI SDK
- Google Cloud Translation SDK

## Notes

- This is a single-user application that stores the API keys in a server-side file.
- No authentication is implemented, so anyone with access to the server can see the API keys.
- This is currently meant to be run locally on your own computer.

## Requirements

1. Node.js - tested with versions up to 23.2.0

## Setup

1. Clone the repository:
```bash
git clone https://github.com/claudio-silva/ai-translator.git
cd ai-translator
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## API Keys

You'll need to obtain API keys for the translation services you want to use:

- OpenAI API key: https://platform.openai.com/api-keys
- Anthropic API key: https://console.anthropic.com/
- Google Cloud API key: https://console.cloud.google.com/

Enter these keys in the settings dialog (gear icon) in the application.

## Usage

1. Click the settings icon and enter your API keys.
2. Select the target language.
3. Choose a translation model.
4. Enter or paste your text in the left panel.
5. Click "Translate".
6. The translation will appear in the right panel.
7. Use the copy button to copy the translated text or the save button to download it as a file.
8. You may interrupt the translation process by clicking the stop button.

## Author

Cláudio Silva

GitHub: [@claudio-silva](https://github.com/claudio-silva)

## License

This source code is released under the Mozilla Public License, Version 2.0
