import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import itemsRouter from './routes/items.js';

dotenv.config();

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors({ origin: '*' }));
app.use(express.json());

// Health check route
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'BITS Lost & Found API is healthy' });
});

// Main items router mounted at /api/items
app.use('/api/items', itemsRouter);

// Auth routes
app.post('/api/auth/signup', (req, res) => {
  const { email, password } = req.body;
  if (!email || !email.endsWith('bits-pilani.ac.in')) {
    return res.status(400).json({ message: 'Must use a valid @bits-pilani.ac.in email address.' });
  }
  return res.status(200).json({ success: true, message: 'User registered successfully!' });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !email.endsWith('bits-pilani.ac.in')) {
    return res.status(400).json({ message: 'Must use a valid @bits-pilani.ac.in email address.' });
  }
  return res.status(200).json({
    success: true,
    user: { email, id: 'bits_user_1', name: email.split('@')[0] },
    token: 'jwt-auth-token-placeholder'
  });
});

// Direct explicit route for root URL to prevent Cannot GET /
app.get('/*splat', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API route not found' });
  }
  
  // Try looking in public folder first, otherwise fallback to root directory file
  const publicFile = path.join(__dirname, 'public', 'index.html');
  res.sendFile(publicFile, (err) => {
    if (err) {
      res.sendFile(path.join(__dirname, 'index.html'), (rootErr) => {
        if (rootErr) {
          res.status(404).send('UI template file not found on server. Please ensure index.html exists.');
        }
      });
    }
  });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});