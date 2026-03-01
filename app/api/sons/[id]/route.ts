import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isAdminAuthenticated } from '@/lib/auth';
import cloudinary from '@/lib/cloudinary';
import { revalidatePath } from 'next/cache';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const isAuth = await isAdminAuthenticated();
  if (!isAuth) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const sonId = parseInt(params.id, 10);

  const { data: son } = await supabaseAdmin
    .from('sons')
    .select('url, jour_id')
    .eq('id', sonId)
    .single();

  const { error } = await supabaseAdmin.from('sons').delete().eq('id', sonId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (son?.url) {
    try {
      const match = son.url.match(/\/v\d+\/(.+)\.\w+$/);
      if (match) {
        await cloudinary.uploader.destroy(match[1], { resource_type: 'video' });
      }
    } catch {
      // Ignore erreurs Cloudinary
    }
  }

  revalidatePath('/');
  revalidatePath(`/jour/${son?.jour_id}`);

  return NextResponse.json({ ok: true });
}