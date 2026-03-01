export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isAdminAuthenticated } from '@/lib/auth';

// PATCH /api/jours/[id] — modifier titre
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const isAuth = await isAdminAuthenticated();
  if (!isAuth) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const jourId = parseInt(params.id, 10);
  const body = await req.json();

  const { error } = await supabaseAdmin
    .from('jours')
    .update({ titre: body.titre, titre_ar: body.titre_ar })
    .eq('id', jourId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}