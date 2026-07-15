import pt from './pt';
import en from './en';
import fr from './fr';
import pl from './pl';
import id from './id';

export const translations = {
  pt,
  en,
  fr,
  pl,
  id,
};

export type LanguageCode = keyof typeof translations;
