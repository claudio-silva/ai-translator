import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from './ui/tooltip';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Settings } from '../types';
import { Settings as SettingsIcon } from 'lucide-react';
import { getSettings, updateSettings } from '../lib/api';
import { useTranslation } from 'react-i18next';
import { INTERFACE_LANGUAGES } from '../types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

interface SettingsDialogProps {
  settings: Settings;
  onSettingsChange: (settings: Settings) => void;
}

export function SettingsDialog({ settings, onSettingsChange }: SettingsDialogProps) {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = React.useState(false);
  const [localSettings, setLocalSettings] = React.useState<Settings>(settings);
  const [error, setError] = React.useState<string | null>(null);

  // Sync localSettings with parent settings
  React.useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  React.useEffect(() => {
    if (open) {
      getSettings().then(({ settings: serverSettings }) => {
        setLocalSettings({
          openaiKey: serverSettings.OPENAI_API_KEY || '',
          anthropicKey: serverSettings.ANTHROPIC_API_KEY || '',
          googleKey: serverSettings.GOOGLE_SERVICE_ACCOUNT || '',
          interfaceLanguage: serverSettings.interfaceLanguage || localStorage.getItem('interfaceLanguage') || 'en'
        });
      }).catch(console.error);
    } else {
      // Reset language to parent settings when dialog is closed without saving
      i18n.changeLanguage(settings.interfaceLanguage);
    }
  }, [open, settings.interfaceLanguage]);

  const handleSave = async () => {
    try {
      setError(null); // Clear any previous errors
      await updateSettings(localSettings);
      onSettingsChange(localSettings);
      i18n.changeLanguage(localSettings.interfaceLanguage);
      localStorage.setItem('interfaceLanguage', localSettings.interfaceLanguage);
      setOpen(false);
    } catch (error) {
      console.error('Failed to save settings:', error);
      if (error instanceof Error) {
        setError(t(error.message));
      } else {
        setError(t('settings.errors.updateFailed'));
      }
    }
  };

  const handleLanguageChange = (value: string) => {
    const newSettings = { ...localSettings, interfaceLanguage: value };
    setLocalSettings(newSettings);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setOpen(false);
      setError(null); // Clear error when dialog is closed
    } else {
      setOpen(true);
      setError(null); // Clear error when dialog is opened
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon">
              <SettingsIcon className="h-4 w-4" />
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p>{t('settingsTooltip')}</p>
        </TooltipContent>
      </Tooltip>

      <DialogContent onCloseAutoFocus={(e) => {
        e.preventDefault();
        document.body.focus();
      }} className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('settings.title')}</DialogTitle>
        </DialogHeader>
        {error && (
          <div className="bg-destructive/15 text-destructive px-4 py-2 rounded-md text-sm">
            {error}
          </div>
        )}
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="openai">{t('settings.openaiLabel')}</Label>
            <Input
              id="openai"
              value={localSettings.openaiKey}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setLocalSettings({ ...localSettings, openaiKey: e.target.value })
              }
              placeholder={t('settings.openaiPlaceholder')}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="anthropic">{t('settings.anthropicLabel')}</Label>
            <Input
              id="anthropic"
              value={localSettings.anthropicKey}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setLocalSettings({ ...localSettings, anthropicKey: e.target.value })
              }
              placeholder={t('settings.anthropicPlaceholder')}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="google">{t('settings.googleLabel')}</Label>
            <Textarea
              id="google"
              value={localSettings.googleKey}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setLocalSettings({ ...localSettings, googleKey: e.target.value })
              }
              placeholder={t('settings.googlePlaceholder')}
              className="h-[100px] font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              {t('settings.googleHelp')}
            </p>
          </div>
          <div className="space-y-2">
            <Label>{t('settings.interfaceLanguage')}</Label>
            <Select
              value={localSettings.interfaceLanguage}
              onValueChange={handleLanguageChange}
            >
              <SelectTrigger>
                <SelectValue>
                  {t(`languages.${localSettings.interfaceLanguage}`)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {INTERFACE_LANGUAGES.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {t(`languages.${lang.code}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end">
          <Button 
            variant="default"
            onClick={handleSave}
          >
            {t('settings.save')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 