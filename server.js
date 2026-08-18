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
app.use(express.static(path.join(__dirname, 'assets')));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'BITS Lost & Found API is healthy' });
});

// API Routes
app.use('/api/items', itemsRouter);

app.post('/api/auth/login', (req, res) => {
  const { email } = req.body;
  if (!email || !email.endsWith('bits-pilani.ac.in')) {
    return res.status(400).json({ message: 'Must use a valid @bits-pilani.ac.in email address.' });
  }
  return res.status(200).json({
    success: true,
    user: { email, id: 'bits_user_1', name: email.split('@')[0] },
    token: 'jwt-auth-token-placeholder'
  });
});

// Fixed modern Express wildcard route
app.get(/(.*)/, (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API route not found' });
  }
  
  const filePath = path.resolve(__dirname, 'index.html');
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error("Error sending file:", err);
      res.status(404).send("UI index.html file not found on server container path.");
    }
  });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});