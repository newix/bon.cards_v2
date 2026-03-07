import { randomUUID } from 'node:crypto';
import { ChatMessage } from '../types/domain';

const escapeHtml = (value: string): string => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

export class ChatService {
  global: ChatMessage[] = [];

  make(channel: ChatMessage['channel'], sender: string, text: string, system = false): ChatMessage {
    return {
      id: randomUUID(),
      channel,
      sender: escapeHtml(sender),
      text: escapeHtml(text),
      createdAt: new Date().toISOString(),
      system
    };
  }

  addGlobal(sender: string, text: string): ChatMessage {
    const msg = this.make('global', sender, text);
    this.global.push(msg);
    this.global = this.global.slice(-120);
    return msg;
  }
}
