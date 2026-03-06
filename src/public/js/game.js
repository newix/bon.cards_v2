const socket = io();
const matchId = location.pathname.split('/').pop();
socket.emit('match:join', { matchId });
socket.on('match:state', (s) => { document.getElementById('state').textContent = JSON.stringify(s, null, 2); });
