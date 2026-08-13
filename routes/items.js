import express from 'express';
import { supabase } from '../config/supabase.js';

const router = express.Router();

// GET /api/items - Fetch items directly from Supabase
router.get('/', async (req, res, next) => {
  try {
    const { type, location, campus } = req.query;

    let query = supabase.from('items').select('*').order('created_at', { ascending: false });

    if (type) query = query.eq('type', type);
    if (location) query = query.ilike('location', `%${location}%`);
    if (campus) query = query.eq('campus', campus);

    const { data: items, error } = await query;

    if (error) {
      console.error("Supabase Error:", error);
      throw error;
    }

    res.json({
      success: true,
      count: items.length,
      items
    });
  } catch (error) {
    next(error);
  }
});

export default router;