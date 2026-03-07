import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

export interface NewsItem {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  language: 'ru' | 'en';
  publishedAt: string;
  isPublished: boolean;
  tags: string[];
  coverImage: string;
}

export class NewsRepository {
  async all(language?: 'ru' | 'en'): Promise<NewsItem[]> {
    const langs = language ? [language] : ['ru', 'en'];
    const items: NewsItem[] = [];
    for (const lang of langs) {
      const dir = `data/news/${lang}`;
      const files = await readdir(dir);
      for (const file of files.filter((f) => f.endsWith('.json'))) {
        const raw = await readFile(join(dir, file), 'utf-8');
        const n = JSON.parse(raw) as NewsItem;
        if (n.isPublished) items.push(n);
      }
    }
    return items.sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt));
  }

  async bySlug(slug: string, lang: 'ru' | 'en'): Promise<NewsItem | undefined> {
    const items = await this.all(lang);
    return items.find((n) => n.slug === slug);
  }
}
