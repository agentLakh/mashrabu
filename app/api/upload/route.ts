import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isAdminAuthenticated } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const isAuth = await isAdminAuthenticated();
  if (!isAuth) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const timestamp = Math.round(Date.now() / 1000);
  const folder = 'mashrabu';
  const params = `folder=${folder}&timestamp=${timestamp}`;
  const signature = crypto.createHash('sha1').update(params + process.env.CLOUDINARY_API_SECRET).digest('hex');

  return NextResponse.json({
    signature, timestamp, folder,
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
  });
}

export async function POST(req: NextRequest) {
  const isAuth = await isAdminAuthenticated();
  if (!isAuth) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const { jour_id, kourel_id, nom, type, ordre, url, duration } = await req.json();

  if (!jour_id && !kourel_id) return NextResponse.json({ error: 'jour_id ou kourel_id requis' }, { status: 400 });

  const dureeStr = duration > 0
    ? `${Math.floor(duration / 60)}:${Math.round(duration % 60).toString().padStart(2, '0')}`
    : '--:--';

  const insertData: any = { nom, type, duree: dureeStr, url, ordre };
  if (jour_id) insertData.jour_id = jour_id;
  if (kourel_id) insertData.kourel_id = kourel_id;

  const { data: son, error } = await supabaseAdmin.from('sons').insert(insertData).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  revalidatePath('/');
  return NextResponse.json({ son }, { status: 201 });
}
