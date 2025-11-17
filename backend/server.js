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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running at http://localhost:${PORT}`));
