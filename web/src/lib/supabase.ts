import { createClient, SupabaseClient } from '@supabase/supabase-js';
import axios from 'axios';
import { apiBaseUrl } from '../api/client';

let supabaseClient: SupabaseClient | null = null;

const DEFAULT_SUPABASE_URL = 'https://msozshwatonyxnkaqjfs.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zb3pzaHdhdG9ueXhua2FxamZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2MjU5MzYsImV4cCI6MjA4ODIwMTkzNn0.lbfHxn4YxXNLHB0uVBDInrHh8wsCbusDr1_SroACHgk';

export async function getSupabaseClient(): Promise<SupabaseClient> {
  if (supabaseClient) {
    return supabaseClient;
  }

  const envUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

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

  supabaseClient = createClient(DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_ANON_KEY);
  return supabaseClient;
}
