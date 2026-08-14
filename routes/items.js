import express from 'express';
import { supabase } from '../config/supabase.js';

const router = express.Router();

// GET /api/items
router.get('/', async (req, res, next) => {
  try {
    const { data: items, error } = await supabase
      .from('items')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ success: false, error: error.message });
    }

    res.json({
      success: true,
      count: items ? items.length : 0,
      items: items || [],
    });
  } catch (err) {
    next(err);
  }
});

export default router;