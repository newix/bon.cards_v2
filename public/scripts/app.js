(() => {
  const burger = document.getElementById('burgerBtn');
  const nav = document.getElementById('mainNav');
  burger?.addEventListener('click', () => nav?.classList.toggle('open'));

  const logoutBtn = document.getElementById('logoutBtn');
  logoutBtn?.addEventListener('click', async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    location.href = '/';
  });
})();
