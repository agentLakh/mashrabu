import { redirect } from 'next/navigation';
import { isAdminAuthenticated } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import AdminDashboardClient from './AdminDashboardClient';

import { supabase } from '@/lib/supabase';

async function getData() {
  const { data: jours } = await supabase
    .from('jours')
    .select('*')
    .order('numero', { ascending: true });

  if (!jours) return [];

  const joursWithCount = await Promise.all(
    jours.map(async (jour) => {
      const { count } = await supabase
        .from('sons')
        .select('*', { count: 'exact', head: true })
        .eq('jour_id', jour.id);
      return { ...jour, sonsCount: count ?? 0 };
    })
  );

  return joursWithCount;
}

export default async function AdminDashboardPage() {
  const isAuth = await isAdminAuthenticated();
  if (!isAuth) redirect('/admin');

  const jours = await getData();

  return <AdminDashboardClient jours={jours} />;
}
