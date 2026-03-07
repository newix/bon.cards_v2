import ru from './locales/ru.json';
import en from './locales/en.json';
import { Locale } from '../types/domain';

const dict = { ru, en };

export const t = (locale: Locale, key: string): string => dict[locale]?.[key as keyof typeof ru] ?? key;

export const translateError = (locale: Locale, code: string): string => {
  const map: Record<string, string> = {
    UNAUTHORIZED: 'errors.unauthorized',
    INVALID_CREDENTIALS: 'errors.invalidCredentials',
    USERNAME_TAKEN: 'errors.usernameTaken',
    READ_ONLY_FOR_GUESTS: 'errors.readOnlyGuests'
  };
  return t(locale, map[code] ?? code);
};
