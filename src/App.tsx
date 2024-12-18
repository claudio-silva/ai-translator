import { useEffect, useState, useRef } from 'react';
import { Button } from './components/ui/button';
import { Textarea } from './components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from './components/ui/tooltip';
import { Label } from './components/ui/label';
import { SettingsDialog } from './components/SettingsDialog';
import { ThemeToggle } from './components/ui/theme-toggle';
import { Copy, X, File, ArrowUp, Download } from 'lucide-react';
import { LANGUAGES, MODELS, type Language, type Settings, type TranslationModel } from './types';
import { translate, getSettings } from './lib/api';
import { useTranslation } from 'react-i18next';
import { TooltipProvider } from './components/ui/tooltip';
import { AlertProvider, useAlert } from "@/hooks/use-alert"

// Initialize theme from localStorage or system preference
const initializeTheme = () => {
  const saved = localStorage.getItem("theme");
  if (saved) {
    document.documentElement.classList.add(saved);
  } else {
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    document.documentElement.classList.add(systemTheme);
    localStorage.setItem("theme", systemTheme);
  }
};

function AppContent() {
  const { t } = useTranslation();
  const { alert } = useAlert();
  const [targetLang, setTargetLang] = useState<Language>(LANGUAGES[0]);
  const [model, setModel] = useState<TranslationModel>(MODELS[0]);
  const [sourceText, setSourceText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [settings, setSettings] = useState<Settings>({
    openaiKey: '',
    anthropicKey: '',
    googleKey: '',
    interfaceLanguage: localStorage.getItem('interfaceLanguage') || 'en'
  });
  const abortController = useRef<AbortController | null>(null);
  const outputRef = useRef<HTMLTextAreaElement>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    initializeTheme();
  }, []);

  useEffect(() => {
    getSettings().catch(console.error);
  }, []);

  // Handle scroll position changes
  const handleScroll = () => {
    if (outputRef.current) {
      setShowScrollTop(outputRef.current.scrollTop > 0);
    }
  };

  // Scroll to bottom when new text is added during translation
  useEffect(() => {
    if (outputRef.current && translatedText) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [translatedText]);

  const handleTranslate = async () => {
    if (!sourceText.trim()) return;
    
    setIsTranslating(true);
    setTranslatedText('');
    setShowScrollTop(false);
    
    // Create new AbortController for this request
    abortController.current = new AbortController();
    
    try {
      const chunks: string[] = [];
      for await (const chunk of translate(sourceText, targetLang, model, abortController.current.signal)) {
        chunks.push(chunk);
        setTranslatedText(chunks.join('\n\n'));
      }
    } catch (error: any) {
      console.error('Translation error:', error);
      if (error instanceof Error && error.name === 'AbortError') {
        setTranslatedText(t('translation.cancelled'));
      } else if (error instanceof Error) {
        alert(t(error.message));
      } else {
        alert(t('translation.failed'));
      }
    } finally {
      setIsTranslating(false);
      abortController.current = null;
    }
  };

  const handleCancel = () => {
    if (abortController.current) {
      abortController.current.abort();
      abortController.current = null;
    }
  };

  const handleClear = () => {
    setSourceText('');
    setTranslatedText('');
    setShowScrollTop(false);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(translatedText);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleScrollToTop = () => {
    if (outputRef.current) {
      outputRef.current.scrollTop = 0;
    }
  };

  const handleDownload = () => {
    const defaultName = `translation-${model.id.toLowerCase()}.txt`;
    const filename = window.prompt(t('saveAs'), defaultName);
    
    if (filename) {
      const blob = new Blob([translatedText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename.endsWith('.txt') ? filename : `${filename}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const textareaClasses = "h-full resize-none [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-secondary [&::-webkit-scrollbar-thumb]:bg-muted-foreground/50 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:border-2 [&::-webkit-scrollbar-thumb]:border-background";

  return (
    <TooltipProvider delayDuration={0}>
      <div className="min-h-screen flex flex-col">
        <div className="bg-zinc-200 dark:bg-zinc-800 border-b border-zinc-300 dark:border-zinc-900">
          <div className="flex items-center justify-between px-4 py-2">
            <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">{t('appTitle')}</h1>
            <div className="flex gap-2">
              <ThemeToggle />
              <SettingsDialog settings={settings} onSettingsChange={setSettings} />
            </div>
          </div>
        </div>

        <div className="p-4 pb-2">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Label htmlFor="target-lang" className="whitespace-nowrap">{t('translateTo')}</Label>
              <Select
                value={targetLang.code}
                onValueChange={(value) => setTargetLang(LANGUAGES.find(lang => lang.code === value)!)}
              >
                <SelectTrigger id="target-lang" className="w-[180px]">
                  <SelectValue>
                    {targetLang ? t(`languages.${targetLang.code}`) : t('translateTo')}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {t(`languages.${lang.code}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Label htmlFor="model">{t('model')}</Label>
              <Select
                value={model.id}
                onValueChange={(value) => setModel(MODELS.find(m => m.id === value)!)}
              >
                <SelectTrigger id="model" className="w-[160px]">
                  <SelectValue placeholder="Translation Model" />
                </SelectTrigger>
                <SelectContent>
                  {MODELS.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {t(`models.${m.id}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="default"
                onClick={handleTranslate}
                disabled={isTranslating || !sourceText.trim()}
              >
                {isTranslating ? t('translatingButton') : t('translateButton')}
              </Button>

              {isTranslating && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleCancel}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t('cancelButton')}</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-2 gap-4 px-4 pb-4">
          <div className="relative h-full shadow-md rounded-lg overflow-hidden">
            <Textarea
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              placeholder={t('sourcePlaceholder')}
              className={textareaClasses}
            />
            {sourceText && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={handleClear}
                  >
                    <File className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t('newTranslation')}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          <div className="relative h-full shadow-md rounded-lg overflow-hidden">
            <Textarea
              ref={outputRef}
              value={translatedText}
              readOnly
              placeholder={t('targetPlaceholder')}
              className={textareaClasses}
              onScroll={handleScroll}
            />
            <div className="absolute top-2 right-2 flex gap-2">
              {showScrollTop && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleScrollToTop}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t('scrollTopButton')}</p>
                  </TooltipContent>
                </Tooltip>
              )}
              {translatedText && (
                <>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleCopy}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t('copyButton')}</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleDownload}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t('downloadButton')}</p>
                    </TooltipContent>
                  </Tooltip>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

export default function App() {
  return (
    <AlertProvider>
      <AppContent />
    </AlertProvider>
  )
}
