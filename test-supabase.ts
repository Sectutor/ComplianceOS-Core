import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

console.log('Testing Supabase Auth Setup:');
console.log('Supabase URL:', supabaseUrl);
console.log('Service Key set:', !!supabaseServiceKey);

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Test with a dummy token
console.log('\nSupabase client created successfully');
console.log('You can now test with a real token by calling supabase.auth.getUser(token)');
