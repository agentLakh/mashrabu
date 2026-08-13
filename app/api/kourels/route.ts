import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const { edition_id, nom, nom_ar, ordre } = await req.json();
  if (!edition_id || !nom) return NextResponse.json({ error: 'Champs manquants' }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from('kourels')
    .insert({ edition_id, nom, nom_ar: nom_ar || '', ordre: ordre || 1 })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ kourel: data }, { status: 201 });
}
