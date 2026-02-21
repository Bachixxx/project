import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase
    .from('exercises')
    .select('name, tracking_type, track_reps, track_weight, track_duration, track_distance')
    .ilike('name', '%échauffement coude%');
    
  console.log(JSON.stringify(data, null, 2));
}

check();
