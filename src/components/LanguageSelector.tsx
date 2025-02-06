'use client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type LanguageSelectorProps = {
  currentLang: string;
  onLanguageChange: (lang: string) => void;
};

const languageNames: Record<string, string> = {
  en: 'English',
  es: 'Español',
  de: 'Deutsch'
};

export default function LanguageSelector({ currentLang, onLanguageChange }: LanguageSelectorProps) {
  return (
    <Select value={currentLang} onValueChange={onLanguageChange}>
      <SelectTrigger className="w-[140px]" aria-label={`Select language. Current language: ${languageNames[currentLang]}`}>
        <SelectValue>{languageNames[currentLang]}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {Object.entries(languageNames).map(([lang, name]) => (
          <SelectItem key={lang} value={lang}>
            {name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
} 