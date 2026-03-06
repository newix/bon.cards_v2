import { randomUUID } from 'node:crypto';
import { ChatMessage } from '../types/domain';

export class ChatService {
  global: ChatMessage[] = [];
  make(channel: ChatMessage['channel'], sender: string, text: string, system = false): ChatMessage {
    return { id: randomUUID(), channel, sender, text: text.replace(/[<>]/g, ''), createdAt: new Date().toISOString(), system };
  }
  addGlobal(sender: string, text: string): ChatMessage { const m = this.make('global', sender, text); this.global.push(m); return m; }
}
