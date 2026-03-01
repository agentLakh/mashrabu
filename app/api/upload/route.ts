import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { uploadAudio } from '@/lib/cloudinary';
import { isAdminAuthenticated } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function POST(req: NextRequest) {
  const isAuth = await isAdminAuthenticated();
  if (!isAuth) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const nom = formData.get('nom') as string;
    const type = formData.get('type') as string || 'Audio';
    const jour_id = parseInt(formData.get('jour_id') as string, 10);
    const ordre = parseInt(formData.get('ordre') as string, 10);

    if (!file || !nom || !jour_id) {
      return NextResponse.json({ error: 'Champs manquants' }, { status: 400 });
    }

    // Convertit le fichier en Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload vers Cloudinary dans le dossier mashrabu/jour_{id}
    const { url, duration } = await uploadAudio(
      buffer,
      `jour${jour_id}_${ordre}_${nom.replace(/\s+/g, '_')}`,
      `mashrabu/jour_${jour_id}`
    );

    // Formate la durée en mm:ss
    const dureeStr = duration > 0
      ? `${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}`
      : '--:--';

    // Sauvegarde dans Supabase
    const { data: son, error } = await supabaseAdmin
      .from('sons')
      .insert({ jour_id, nom, type, duree: dureeStr, url, ordre })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Invalide le cache des pages concernées
    revalidatePath('/');
    revalidatePath(`/jour/${jour_id}`);

    return NextResponse.json({ son }, { status: 201 });

  } catch (err: any) {
    console.error('Upload error:', err);
    return NextResponse.json({ error: err.message || 'Erreur serveur' }, { status: 500 });
  }
}

// Augmente la limite de taille des fichiers (50MB)
export const maxDuration = 60;