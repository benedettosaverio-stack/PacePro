import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

// Types
export type User = {
  id: string;
  email: string;
  name: string;
  photo: string;
  created_at: string;
};

export type Session = {
  id: string;
  user_id: string;
  workout_name: string;
  duration: number;
  total_volume: number;
  completed_sets: any;
  entries: any[];
  date: string;
};

// Sauvegarde une séance terminée
export async function saveSession(userId: string, session: Omit<Session, 'id' | 'user_id' | 'date'>): Promise<Session | null> {
  const { data, error } = await supabase
    .from('sessions')
    .insert({ user_id: userId, ...session })
    .select()
    .single();
  if (error) { console.error('saveSession error:', error); return null; }
  return data;
}

// Récupère toutes les séances d'un utilisateur
export async function getSessions(userId: string): Promise<Session[]> {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });
  if (error) { console.error('getSessions error:', error); return []; }
  return data || [];
}
