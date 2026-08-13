import dotenv from 'dotenv';
dotenv.config(); // Must be called BEFORE importing route handlers!

import express from 'express';
import cors from 'cors';
import itemsRouter from './routes/items.js';

const app = express();

app.use(cors({ origin: process.env.ALLOWED_ORIGIN || '*' }));
app.use(express.json());

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'BITS Lost & Found API is healthy' });
});

// Main API Routes
app.use('/api/items', itemsRouter);

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});