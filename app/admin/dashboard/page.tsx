import { redirect } from 'next/navigation';
import { isAdminAuthenticated } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import AdminDashboardClient from './AdminDashboardClient';

export const revalidate = 0;

export default async function AdminDashboardPage() {
  const isAuth = await isAdminAuthenticated();
  if (!isAuth) redirect('/admin');

  return <AdminDashboardClient editions={[]} joursParEdition={{}} />;
}