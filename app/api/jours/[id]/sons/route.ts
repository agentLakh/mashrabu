export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';


export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const jourId = parseInt(params.id, 10);

  const { data: sons, error } = await supabase
    .from('sons')
    .select('*')
    .eq('jour_id', jourId)
    .order('ordre', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ sons: sons || [] });
}