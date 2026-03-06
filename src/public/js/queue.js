const statusEl = document.getElementById('status');
async function post(url){ const r = await fetch(url,{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'}}); statusEl.textContent = JSON.stringify(await r.json()); }
document.getElementById('join')?.addEventListener('click',()=>post('/api/matchmaking/join'));
document.getElementById('leave')?.addEventListener('click',()=>post('/api/matchmaking/leave'));
setInterval(async ()=>{ const r=await fetch('/api/matchmaking/status',{credentials:'include'}); statusEl.textContent = JSON.stringify(await r.json()); },3000);
