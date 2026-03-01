import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isAdminAuthenticated } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

// GET /api/editions
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('editions')
    .select('*')
    .order('annee', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ editions: data || [] });
}

// POST /api/editions — crée une édition + génère les 30 jours automatiquement
export async function POST(req: NextRequest) {
  const isAuth = await isAdminAuthenticated();
  if (!isAuth) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const body = await req.json();
  const { annee, titre, titre_ar, date_premier_jour } = body;

  if (!annee || !date_premier_jour) {
    return NextResponse.json({ error: 'annee et date_premier_jour sont requis' }, { status: 400 });
  }

  // Crée l'édition
  const { data: edition, error: editionError } = await supabaseAdmin
    .from('editions')
    .insert({ annee, titre: titre || `Mashrabuç Çâfî ${annee}`, titre_ar: titre_ar || '' })
    .select()
    .single();

  if (editionError) return NextResponse.json({ error: editionError.message }, { status: 500 });

  // Génère les 30 jours
  const jours = [];
  const startDate = new Date(date_premier_jour);

  for (let i = 0; i < 30; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    jours.push({
      edition_id: edition.id,
      numero: i + 1,
      titre: `Kourel Jour ${i + 1}`,
      titre_ar: '',
      date_programme: date.toISOString().split('T')[0],
    });
  }

  const { error: joursError } = await supabaseAdmin.from('jours').insert(jours);
  if (joursError) return NextResponse.json({ error: joursError.message }, { status: 500 });

  revalidatePath('/');
  return NextResponse.json({ edition }, { status: 201 });
}
