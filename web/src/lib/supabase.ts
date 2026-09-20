import { createClient, SupabaseClient } from '@supabase/supabase-js';
import axios from 'axios';
import { apiBaseUrl } from '../api/client';

let supabaseClient: SupabaseClient | null = null;

export async function getSupabaseClient(): Promise<SupabaseClient> {
  if (supabaseClient) {
    return supabaseClient;
  }

  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (envUrl && envKey && !envUrl.includes('placeholder')) {
    supabaseClient = createClient(envUrl, envKey);
    return supabaseClient;
  }

  // Fallback: Lấy cấu hình public từ backend API
  try {
    const res = await axios.get(`${apiBaseUrl}/auth/config`);
    const { supabaseUrl, supabaseAnonKey } = res.data;
    if (supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('placeholder')) {
      supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
      return supabaseClient;
    }
  } catch (err) {
    console.warn('Không thể tải cấu hình Supabase từ backend:', err);
  }

  throw new Error('Chưa cấu hình SUPABASE_URL và SUPABASE_ANON_KEY trong Environment Variables trên Vercel!');
}
