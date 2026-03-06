(() => {
  const statusEl = document.getElementById('queueStatus');
  const joinBtn = document.getElementById('joinQueueBtn');
  const leaveBtn = document.getElementById('leaveQueueBtn');
  if (!statusEl || !joinBtn || !leaveBtn) return;

  const refresh = async () => {
    const r = await fetch('/api/matchmaking/status', { credentials: 'include' });
    const data = await r.json();
    statusEl.textContent = data.queued ? `In queue, position: ${data.position}` : 'Not in queue';
  };

  joinBtn.addEventListener('click', async () => {
    const r = await fetch('/api/matchmaking/join', { method: 'POST', credentials: 'include' });
    const body = await r.json();
    if (body.matchId) location.href = `/game/${body.matchId}`;
    await refresh();
  });

  leaveBtn.addEventListener('click', async () => {
    await fetch('/api/matchmaking/leave', { method: 'POST', credentials: 'include' });
    await refresh();
  });

  refresh();
  setInterval(refresh, 5000);
})();
