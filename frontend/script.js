// frontend/script.js
const pingBtn = document.getElementById('pingBtn');
const out = document.getElementById('out');

const BACKEND_URL = 'http://localhost:3000/ping'; // change to render URL after deploy

pingBtn.addEventListener('click', async () => {
  const host = document.getElementById('host').value.trim();
  if (!host) return alert('Enter host');

  out.textContent = 'Pinging...';
  try {
    const res = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ host }),
    });

    const data = await res.json();
    if (!res.ok) {
      out.textContent = `Error: ${data.error || JSON.stringify(data)}`;
      return;
    }
    out.textContent = JSON.stringify(data, null, 2);
  } catch (err) {
    out.textContent = 'Fetch failed: ' + err.message;
  }
});
