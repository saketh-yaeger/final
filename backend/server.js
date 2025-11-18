const express = require('express');
const cors = require('cors');
const { execFile } = require('child_process');

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json());

app.post('/ping', (req, res) => {
  const requestTime = Date.now();
  const { host } = req.body;

  if (!host || typeof host !== 'string') {
    return res.status(400).json({ success: false, error: 'Invalid host' });
  }

  const safeHost = /^[A-Za-z0-9.\-:]+$/.test(host) ? host : null;
  if (!safeHost) {
    return res.status(400).json({ success: false, error: 'Invalid characters in host' });
  }

  const isWin = process.platform === 'win32';
  const cmd = 'ping';
  const args = isWin ? ['-n', '1', host] : ['-c', '1', host];

  execFile(cmd, args, { timeout: 10_000 }, (err, stdout, stderr) => {
    const serverLatencyMs = Date.now() - requestTime;
    const serverLatency = `${serverLatencyMs} ms`;

    if (err) {
      return res.json({
        success: false,
        error: 'Ping failed',
        details: stderr || err.message,
        serverLatency,
        networkLatency: null
      });
    }

    const out = stdout.toString();
    let networkLatency = null;

    const match = out.match(/time[=<]?\s*(\d+\.?\d*)\s*ms/);
    if (match) networkLatency = `${match[1]} ms`;

    res.json({
      success: true,
      host,
      networkLatency,
      serverLatency,
      raw: out
    });
  });
});

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Ping Tool</title>
      <style>
        body { font-family: system-ui, sans-serif; background: #0d1117; color: #c9d1d9; padding: 40px; margin: 0; }
        h1 { color: #58a6ff; }
        .container { max-width: 800px; margin: auto; background: #161b22; padding: 30px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.5); }
        input { width: 100%; padding: 14px; font-size: 18px; border: 1px solid #30363d; background: #0d1117; color: white; border-radius: 8px; box-sizing: border-box; }
        button { margin-top: 15px; padding: 14px 28px; font-size: 18px; background: #238636; color: white; border: none; border-radius: 8px; cursor: pointer; }
        button:hover { background: #2ea043; }
        .result { margin-top: 25px; padding: 20px; background: #0d1117; border-radius: 8px; border: 1px solid #30363d; white-space: pre-wrap; font-family: 'Consolas', monospace; line-height: 1.6; overflow-x: auto; }
        .success { color: #56d364; }
        .fail { color: #f85149; }
        .latency { font-size: 24px; font-weight: bold; margin: 10px 0; }
        .label { color: #8b949e; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🚀 Ping Tool</h1>
        <input id="host" placeholder="Enter host (e.g. google.com, 1.1.1.1, yahoo.com)" autofocus />
        <button onclick="ping()">Ping it!</button>

        <div id="result">Enter a host and click the button →</div>
      </div>

      <script>
        async function ping() {
          const host = document.getElementById('host').value.trim() || '8.8.8.8';
          const resultDiv = document.getElementById('result');
          resultDiv.textContent = 'Pinging ' + host + '...';

          try {
            const res = await fetch('/ping', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ host })
            });
            const data = await res.json();

            if (data.success) {
              resultDiv.innerHTML = \`
                <div class="success">✅ Success!</div>
                <div><span class="label">Host:</span> \${data.host}</div>
                <div class="latency">🌐 Network latency: \${data.networkLatency || 'N/A'}</div>
                <div class="latency">🖥️  Server processing: \${data.serverLatency}</div>
                <div style="margin-top:20px; opacity:0.8; font-size:14px;">
                  <details>
                    <summary>Show raw ping output</summary>
                    <pre style="margin-top:10px; font-size:13px;">\${data.raw}</pre>
                  </details>
                </div>
              \`;
            } else {
              resultDiv.innerHTML = \`
                <div class="fail">❌ Failed</div>
                <div><span class="label">Error:</span> \${data.error}</div>
                <div style="opacity:0.8;">\${data.details || ''}</div>
                <div class="latency">Server processing: \${data.serverLatency}</div>
              \`;
            }
          } catch (err) {
            resultDiv.innerHTML = '<div class="fail">Network error: ' + err.message + '</div>';
          }
        }

        // Allow pressing Enter in the input box
        document.getElementById('host').addEventListener('keypress', e => {
          if (e.key === 'Enter') ping();
        });
      </script>
    </body>
    </html>
  `);
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running at http://localhost:${PORT}`));
