import { Server } from 'socket.io';
import { chatService, activeMatches, gameEngine } from '../content/context';

export const wireSockets = (io: Server) => {
  io.on('connection', (socket) => {
    socket.emit('chat:global:history', chatService.global);

    socket.on('chat:global:send', (payload: { username?: string; text: string; authorized: boolean }) => {
      if (!payload.authorized) return socket.emit('error:chat', { error: 'READ_ONLY_FOR_GUESTS' });
      const msg = chatService.addGlobal(payload.username ?? 'anon', payload.text);
      io.emit('chat:global:new', msg);
    });

    socket.on('match:join', ({ matchId }) => {
      socket.join(`match:${matchId}`);
      const match = activeMatches.get(matchId);
      if (match) socket.emit('match:state', serialize(match));
    });

    socket.on('match:submit', ({ matchId, userId, cardId }) => {
      const match = activeMatches.get(matchId);
      if (!match) return;
      try {
        gameEngine.submitCard(match, userId, cardId);
        io.to(`match:${matchId}`).emit('match:state', serialize(match));
      } catch (e) { socket.emit('match:error', { error: (e as Error).message }); }
    });

    socket.on('match:pick', ({ matchId, winnerUserId }) => {
      const match = activeMatches.get(matchId);
      if (!match) return;
      try {
        gameEngine.pickWinner(match, winnerUserId);
        io.to(`match:${matchId}`).emit('match:state', serialize(match));
      } catch (e) { socket.emit('match:error', { error: (e as Error).message }); }
    });
  });

  setInterval(() => {
    for (const [id, match] of activeMatches.entries()) {
      if (match.state === 'JUDGING' && match.timers.judgeUntil && Date.now() > match.timers.judgeUntil && match.settings.enableGuestJudgeBot) {
        try { gameEngine.pickWinner(match); io.to(`match:${id}`).emit('match:state', serialize(match)); } catch {}
      }
    }
  }, 1000);
};

const serialize = (match: any) => ({
  ...match,
  usedBlackIds: [...match.usedBlackIds],
  usedWhiteIds: [...match.usedWhiteIds]
});
