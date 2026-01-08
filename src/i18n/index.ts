import { fr } from './fr';
import { es } from './es';

export const i18n = {
  fr,
  es,
};

export type TranslationKey = keyof typeof fr;

export type Language = keyof typeof i18n;

export const languages = {
  fr: 'Français',
  es: 'Español',
} as const;

// Get browser language or default to French
const getBrowserLanguage = (): Language => {
  const browserLang = navigator.language.split('-')[0];
  return (browserLang in i18n ? browserLang : 'fr') as Language;
};

// Get stored language or browser language
export const getInitialLanguage = (): Language => {
  const stored = localStorage.getItem('language');
  return (stored && stored in i18n ? stored : getBrowserLanguage()) as Language;
};

const replaceStringVariable = (text:string, data: Object) => {
  const keys = Object.keys(data)
  for(let prop in data) {
    text = text.replace(new RegExp('{{'+ prop +'}}','g'), data[prop]);
  }
  
  return text
}


export function t(key: string, lang: Language = 'fr', variables:Object=null): string {
  const keys = key.split('.');
  let value: any = i18n[lang];
  
  for (const k of keys) {
    if (!value || typeof value !== 'object') {
      console.warn(`Translation missing for key: ${key} in language: ${lang}`);
      return key;
    }
    value = value[k];
  }
  
  if (value === undefined) {
    console.warn(`Translation missing for key: ${key} in language: ${lang}`);
    return key;
  }

  if (variables !== null){
    value = replaceStringVariable(value, variables)
  }
  
  return value;
}