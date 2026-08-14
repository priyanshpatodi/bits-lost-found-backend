import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import itemsRouter from './routes/items.js';

dotenv.config();

const app = express();

// Fix for __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors({ origin: '*' }));
app.use(express.json());

// 1. Serve static frontend files from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// Root test route (Optional: if you want the root URL to serve the app instead of JSON, 
// you can comment this out so index.html takes over the root URL)
app.get('/api-status', (req, res) => {
  res.json({ status: 'OK', message: 'BITS Lost & Found API Root' });
});

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

  return res.status(200).json({ 
    success: true, 
    message: 'User registered successfully!' 
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !email.endsWith('bits-pilani.ac.in')) {
    return res.status(400).json({ message: 'Must use a valid @bits-pilani.ac.in email address.' });
  }

  return res.status(200).json({
    success: true,
    user: { 
      email, 
      id: 'bits_user_1',
      name: email.split('@')[0]
    },
    token: 'jwt-auth-token-placeholder'
  });
});

// 2. Catch-all fallback route to serve index.html for web/app pages
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API route not found' });
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});