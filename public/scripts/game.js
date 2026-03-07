(() => {
  const pre = document.getElementById('gameState');
  if (!pre || !window.__APP__.isAuth) return;
  const matchId = window.location.pathname.split('/').pop();
  const socket = io();
  socket.emit('match:join', { matchId });
  socket.on('match:state', (state) => {
    pre.textContent = JSON.stringify(state, null, 2);
  });
})();
