const socket = io();
const chat = document.getElementById('chat');
const msg = document.getElementById('msg');
document.getElementById('send')?.addEventListener('click', () => {
  socket.emit('chat:global:send', { text: msg.value, authorized: window.__AUTH__, username: window.__USER__ });
  msg.value = '';
});
socket.on('chat:global:history', (items) => { chat.innerHTML = items.map((m) => `<div>${m.sender}: ${m.text}</div>`).join(''); });
socket.on('chat:global:new', (m) => { chat.insertAdjacentHTML('beforeend', `<div>${m.sender}: ${m.text}</div>`); });
socket.on('error:chat', (e) => alert(e.error));
