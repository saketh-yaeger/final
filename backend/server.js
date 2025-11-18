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
      <title>Ping Tester</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; background: #f0f0f0; }
        input, button { padding: 12px; font-size: 16px; margin: 10px 0; }
        button { background: #007bff; color: white; border: none; cursor: pointer; padding: 12px 24px; }
        pre { background: #fff; padding: 15px; border-radius: 8px; }
      </style>
    </head>
    <body>
      <h1>Ping Tester</h1>
      <input id="host" placeholder="Enter host (e.g. google.com or 8.8.8.8)" style="width: 400px;" />
      <button onclick="ping()">Ping it!</button>
      <pre id="result">Result will appear here...</pre>

      <script>
        async function ping() {
          const host = document.getElementById('host').value.trim() || '8.8.8.8';
          document.getElementById('result').textContent = 'Pinging...';
          try {
            const response = await fetch('/ping', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ host })
            });
            const data = await response.json();
            document.getElementById('result').textContent = JSON.stringify(data, null, 2);
          } catch (err) {
            document.getElementById('result').textContent = 'Error: ' + err.message;
          }
        }
      </script>
    </body>
    </html>
  `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running at http://localhost:${PORT}`));
