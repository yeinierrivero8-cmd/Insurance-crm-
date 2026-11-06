const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();

// Try multiple possible dist paths
const possiblePaths = [
  path.resolve(__dirname, '..', 'dist'),
  path.resolve(__dirname, '../dist'),
  '/app/dist',
  './dist'
];

let distPath = null;
for (const p of possiblePaths) {
  if (fs.existsSync(p)) {
    distPath = p;
    console.log('✅ Found dist at:', distPath);
    break;
  }
}

if (!distPath) {
  console.error('❌ dist not found at any path!');
  console.error('Tried:', possiblePaths);
  distPath = possiblePaths[0];
}

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', distPath, exists: fs.existsSync(distPath) });
});

// Serve static files
app.use(express.static(distPath));

// SPA fallback
app.get('*', (req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.setHeader('Content-Type', 'text/html');
    res.send(fs.readFileSync(indexPath, 'utf8'));
  } else {
    res.status(404).json({ error: 'index.html not found', path: indexPath });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
