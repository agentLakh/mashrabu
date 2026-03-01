import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Client public (lecture seule côté front)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Client admin (écriture côté serveur uniquement)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// ── Types ──────────────────────────────────────────────────────────────────

export type Jour = {
  id: number;
  numero: number;       // 1 à 30
  titre: string;        // ex: "Kourel Mashrabuç Çâfî"
  titre_ar?: string;    // ex: "الكورال مشرب صافي"
  date_programme: string; // ex: "2026-02-19"
};

export type Son = {
  id: number;
  jour_id: number;
  nom: string;          // ex: "Yakhyra Dayfi"
  type: string;         // ex: "Khassida"
  duree: string;        // ex: "5:32"
  url: string;          // URL Cloudinary
  ordre: number;        // position dans la liste
  created_at: string;
};
