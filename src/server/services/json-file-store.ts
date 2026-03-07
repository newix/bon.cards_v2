import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

export class JsonFileStore<T> {
  private lock: Promise<void> = Promise.resolve();
  constructor(private readonly path: string, private readonly defaultValue: T) {}

  async read(): Promise<T> {
    try {
      const raw = await readFile(this.path, 'utf-8');
      return JSON.parse(raw) as T;
    } catch {
      await this.write(this.defaultValue);
      return this.defaultValue;
    }
  }

  async write(data: T): Promise<void> {
    this.lock = this.lock.then(async () => {
      await mkdir(dirname(this.path), { recursive: true });
      const tmp = `${this.path}.tmp`;
      await writeFile(tmp, JSON.stringify(data, null, 2), 'utf-8');
      await rename(tmp, this.path);
    });
    await this.lock;
  }
}
