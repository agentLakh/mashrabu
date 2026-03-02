import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isAdminAuthenticated } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

// Génère une signature pour upload direct Cloudinary
export async function GET(req: NextRequest) {
  const isAuth = await isAdminAuthenticated();
  if (!isAuth) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const timestamp = Math.round(Date.now() / 1000);
  const folder = 'mashrabu';
  const params = `folder=${folder}&timestamp=${timestamp}`;
  const signature = crypto
    .createHash('sha1')
    .update(params + process.env.CLOUDINARY_API_SECRET)
    .digest('hex');

  return NextResponse.json({
    signature,
    timestamp,
    folder,
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
  });
}

// Sauarde en base après upload Cloudinary
export async function POST(req: NextRequest) {
  const isAuth = await isAdminAuthenticated();
  if (!isAuth) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const { jour_id, nom, type, ordre, url, duration } = await req.json();

  const dureeStr = duration > 0
    ? `${Math.floor(duration / 60)}:${Math.round(duration % 60).toString().padStart(2, '0')}`
    : '--:--';

  const { data: son, error } = await supabaseAdmin
    .from('sons')
    .insert({ jour_id, nom, type, duree: dureeStr, url, ordre })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  revalidatePath('/');
  return NextResponse.json({ son }, { status: 201 });
}
