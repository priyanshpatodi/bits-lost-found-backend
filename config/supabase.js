import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// 1. Force load environment variables right inside this module
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://zqdgqwhzvveiindyolvh.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'sb_publishable_CcfO-AXnPODr2YoZTLihTQ_RRaYvNz1';

if (!supabaseUrl) {
  throw new Error("SUPABASE_URL environment variable is missing.");
}

export const supabase = createClient(supabaseUrl, supabaseKey);
export default supabase;