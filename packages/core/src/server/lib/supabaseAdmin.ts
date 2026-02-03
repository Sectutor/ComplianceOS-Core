
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.warn('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Admin operations will fail.');
}

export const supabaseAdmin = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseServiceRoleKey || 'placeholder',
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);
