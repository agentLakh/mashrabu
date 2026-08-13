import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const kourelId = parseInt(params.id, 10);
  const { data, error } = await supabase
    .from('sons')
    .select('*')
    .eq('kourel_id', kourelId)
    .order('ordre', { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ sons: data || [] });
}
