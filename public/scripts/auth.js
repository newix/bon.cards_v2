const showError = (msg) => { const e = document.getElementById('authError'); if (e) e.textContent = msg; };

const submit = async (url, form) => {
  const data = Object.fromEntries(new FormData(form).entries());
  const res = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || 'REQUEST_FAILED');
  return body;
};

document.getElementById('loginForm')?.addEventListener('submit', async (ev) => {
  ev.preventDefault();
  try { await submit('/api/auth/login', ev.currentTarget); location.href = '/profile'; }
  catch (err) { showError(String(err.message)); }
});

document.getElementById('registerForm')?.addEventListener('submit', async (ev) => {
  ev.preventDefault();
  try { await submit('/api/auth/register', ev.currentTarget); location.href = '/profile'; }
  catch (err) { showError(String(err.message)); }
});
