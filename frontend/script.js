const hostInput = document.getElementById('host');
const pingBtn = document.getElementById('pingBtn');
const loading = document.getElementById('loading');
const result = document.getElementById('result');
const rawDetails = document.getElementById('rawDetails');
const rawPre = document.getElementById('raw');

pingBtn.addEventListener('click', doPing);
hostInput.addEventListener('keydown', e => e.key === 'Enter' && doPing());

async function doPing() {
  const host = hostInput.value.trim();
  if (!host) return alert('Please enter a host');

  loading.classList.remove('hidden');
  result.classList.add('hidden');
  rawDetails.classList.add('hidden');
  document.querySelectorAll('.card').forEach(c => c.classList.remove('error'));

  try {
    const res = await fetch('/ping', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ host })
    });
    const data = await res.json();

    loading.classList.add('hidden');
    result.classList.remove('hidden');

    document.getElementById('hostResult').textContent = data.host || host;
    document.getElementById('networkLatency').textContent = data.networkLatency || 'N/A';
    document.getElementById('serverLatency').textContent = data.serverLatency || 'N/A';

    if (data.success) {
      document.getElementById('status').textContent = 'Success';
      document.querySelector('.card.success i').className = 'ph ph-check-circle';
    } else {
      document.getElementById('status').textContent = 'Failed';
      document.querySelectorAll('.card').forEach(c => c.classList.add('error'));
      document.querySelector('.card.success i').className = 'ph ph-x-circle';
    }

    if (data.raw) {
      rawPre.textContent = data.raw;
      rawDetails.classList.remove('hidden');
    }
  } catch (err) {
    loading.classList.add('hidden');
    alert('Request failed: ' + err.message);
  }
}