import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import itemsRouter from './routes/items.js';

dotenv.config();

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

// Root test route
app.get('/', (req, res) => {
  res.json({ status: 'OK', message: 'BITS Lost & Found API Root' });
});

// Health check route
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'BITS Lost & Found API is healthy' });
});

// Main items router mounted at /api/items
app.use('/api/items', itemsRouter);

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});