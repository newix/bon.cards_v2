(() => {
  const list = document.getElementById('chatList');
  const input = document.getElementById('chatInput');
  const send = document.getElementById('chatSend');
  const hint = document.getElementById('chatHint');
  if (!list) return;

  const socket = io();
  const render = (m) => `<div class="msg"><b>${m.sender}</b><span>${m.text}</span></div>`;

  socket.on('chat:global:history', (messages) => {
    list.innerHTML = messages.map(render).join('');
    list.scrollTop = list.scrollHeight;
  });

  socket.on('chat:global:new', (m) => {
    list.insertAdjacentHTML('beforeend', render(m));
    list.scrollTop = list.scrollHeight;
  });

  socket.on('error:chat', () => {
    if (hint) hint.textContent = window.__APP__.locale === 'ru' ? 'Войдите или зарегистрируйтесь, чтобы писать в чат' : 'Sign in or register to send messages';
  });

  send?.addEventListener('click', () => {
    if (!input?.value.trim()) return;
    socket.emit('chat:global:send', { text: input.value.trim() });
    input.value = '';
  });
})();
