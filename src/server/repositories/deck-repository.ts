import { readdir, readFile, writeFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { z } from 'zod';
import { Deck } from '../types/domain';

const deckSchema = z.object({
  id: z.string().min(1),
  title: z.object({ ru: z.string(), en: z.string() }),
  language: z.enum(['ru', 'en']),
  description: z.object({ ru: z.string(), en: z.string() }),
  blackCards: z.array(z.object({ id: z.string(), text: z.string(), pick: z.literal(1), draw: z.number().default(0) })),
  whiteCards: z.array(z.object({ id: z.string(), text: z.string() }))
});

export class DeckRepository {
  private readonly dir = 'data/decks';

  async loadAll(): Promise<Deck[]> {
    const files = await readdir(this.dir);
    const decks: Deck[] = [];
    for (const file of files.filter((f) => f.endsWith('.json'))) {
      const raw = await readFile(join(this.dir, file), 'utf-8');
      const parsed = deckSchema.parse(JSON.parse(raw));
      this.validateUniq(parsed, file);
      decks.push(parsed);
    }
    return decks;
  }

  async importDeck(deckJson: unknown): Promise<Deck> {
    const deck = deckSchema.parse(deckJson);
    this.validateUniq(deck, 'import');
    await writeFile(join(this.dir, `${deck.id}.json`), JSON.stringify(deck, null, 2), 'utf-8');
    return deck;
  }

  private validateUniq(deck: Deck, from: string): void {
    const allIds = new Set<string>();
    for (const c of [...deck.blackCards, ...deck.whiteCards]) {
      if (allIds.has(c.id)) throw new Error(`DUPLICATE_CARD_ID:${from}:${c.id}`);
      allIds.add(c.id);
    }
  }

  async findById(id: string): Promise<Deck | undefined> {
    return (await this.loadAll()).find((d) => d.id === id);
  }

  mergeDecks(decks: Deck[], dedupeByText: boolean): { black: Deck['blackCards']; white: Deck['whiteCards'] } {
    const black = new Map<string, Deck['blackCards'][number]>();
    const white = new Map<string, Deck['whiteCards'][number]>();
    const whiteText = new Set<string>();
    for (const deck of decks) {
      for (const b of deck.blackCards) if (!black.has(b.id)) black.set(b.id, b);
      for (const w of deck.whiteCards) {
        if (white.has(w.id)) continue;
        if (dedupeByText && whiteText.has(w.text.trim().toLowerCase())) continue;
        white.set(w.id, w);
        whiteText.add(w.text.trim().toLowerCase());
      }
    }
    return { black: [...black.values()], white: [...white.values()] };
  }
}
