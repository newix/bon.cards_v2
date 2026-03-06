import ru from './locales/ru.json';
import en from './locales/en.json';
import { Locale } from '../types/domain';

const dict = { ru, en };
export const t = (locale: Locale, key: string): string => dict[locale]?.[key as keyof typeof ru] ?? key;
