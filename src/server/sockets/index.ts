import { Server } from 'socket.io';
import { activeMatches, chatService, gameEngine, repositories } from '../content/context';
import { messageSchema } from '../validators/schemas';

export const wireSockets = (io: Server) => {
  io.on('connection', async (socket) => {
    const req = socket.request as any;
    const session = req.session;
    const userId = session?.userId as string | undefined;
    const user = userId ? await repositories.users.findById(userId) : undefined;

    socket.emit('chat:global:history', chatService.global);

    socket.on('chat:global:send', (payload: { text: string }) => {
      if (!user) return socket.emit('error:chat', { error: 'READ_ONLY_FOR_GUESTS' });
      try {
        const dto = messageSchema.parse(payload);
        const msg = chatService.addGlobal(user.username, dto.text);
        io.emit('chat:global:new', msg);
      } catch {
        socket.emit('error:chat', { error: 'VALIDATION_ERROR' });
      }
    });

    socket.on('match:join', ({ matchId }) => {
      const match = activeMatches.get(matchId);
      if (!match || !user) return;
      if (!match.players.some((p) => p.userId === user.id)) return;
      socket.join(`match:${matchId}`);
      socket.emit('match:state', serialize(match));
    });

    socket.on('match:submit', ({ matchId, cardId }) => {
      if (!user) return;
      const match = activeMatches.get(matchId);
      if (!match) return;
      try {
        gameEngine.submitCard(match, user.id, cardId);
        io.to(`match:${matchId}`).emit('match:state', serialize(match));
      } catch (e) {
        socket.emit('match:error', { error: (e as Error).message });
      }
    });

    socket.on('match:pick', ({ matchId, winnerUserId }) => {
      if (!user) return;
      const match = activeMatches.get(matchId);
      if (!match) return;
      if (match.players[match.czarIndex]?.userId !== user.id) return;
      try {
        gameEngine.pickWinner(match, winnerUserId);
        io.to(`match:${matchId}`).emit('match:state', serialize(match));
      } catch (e) {
        socket.emit('match:error', { error: (e as Error).message });
      }
    });
  });

  setInterval(() => {
    for (const [id, match] of activeMatches.entries()) {
      if (match.state === 'JUDGING' && match.timers.judgeUntil && Date.now() > match.timers.judgeUntil && match.settings.enableGuestJudgeBot) {
        try {
          gameEngine.pickWinner(match);
          io.to(`match:${id}`).emit('match:state', serialize(match));
        } catch {
          // no-op
        }
      }
    }
  }, 1000);
};

const serialize = (match: any) => ({ ...match, usedBlackIds: [...match.usedBlackIds], usedWhiteIds: [...match.usedWhiteIds] });
