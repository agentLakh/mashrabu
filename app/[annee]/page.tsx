import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';

export const revalidate = 0;

async function getEditionData(annee: number) {
  const { data: edition } = await supabase
    .from('editions')
    .select('*')
    .eq('annee', annee)
    .single();

  if (!edition) return null;

  const { data: jours } = await supabase
    .from('jours')
    .select('*')
    .eq('edition_id', edition.id)
    .order('numero', { ascending: true });

  if (!jours) return { edition, jours: [] };

  const joursWithCount = await Promise.all(
    jours.map(async (jour) => {
      const { count } = await supabase
        .from('sons')
        .select('*', { count: 'exact', head: true })
        .eq('jour_id', jour.id);
      return { ...jour, sonsCount: count ?? 0 };
    })
  );

  return { edition, jours: joursWithCount };
}

export default async function EditionPage({ params }: { params: { annee: string } }) {
  const annee = parseInt(params.annee, 10);
  if (isNaN(annee)) notFound();

  const data = await getEditionData(annee);
  if (!data) notFound();

  const { edition, jours } = data;

  return (
    <main className="min-h-screen relative text-white" style={{ background: 'linear-gradient(135deg, #022c22 0%, #064e3b 50%, #065f46 100%)' }}>
      <div className="absolute top-4 left-4 z-20 pointer-events-none">
        <img src="/mosque.png" alt="Touba" className="h-16 w-12 md:h-20 md:w-16 rounded-2xl object-cover shadow-lg" style={{ boxShadow: '0 0 20px rgba(251,191,36,0.3)' }} />
      </div>
      <div className="absolute top-4 right-4 z-20 pointer-events-none">
        <img src="/bamba.png" alt="Cheikh Ahmadou Bamba" className="h-16 w-12 md:h-20 md:w-16 rounded-2xl object-cover shadow-lg" style={{ boxShadow: '0 0 20px rgba(251,191,36,0.3)' }} />
      </div>

      <div className="scrolling-container">
        <div className="scrolling-text">بَانَ لِكُلِّ مَنْ لَهُ وِلَايَةْ * كَوْنِي لِرَبِّ الْعَالَمِينَ آيَةْ</div>
        <div className="scrolling-text">بَانَ لِكُلِّ مَنْ لَهُ وِلَايَةْ * كَوْنِي لِرَبِّ الْعَالَمِينَ آيَةْ</div>
        <div className="scrolling-text">بَانَ لِكُلِّ مَنْ لَهُ وِلَايَةْ * كَوْنِي لِرَبِّ الْعَالَمِينَ آيَةْ</div>
        <div className="scrolling-text">بَانَ لِكُلِّ مَنْ لَهُ وِلَايَةْ * كَوْنِي لِرَبِّ الْعَالَمِينَ آيَةْ</div>
      </div>
      <div className="pattern-bg fixed inset-0 pointer-events-none"></div>

      <div className="relative z-10 container mx-auto px-4 py-12 max-w-7xl">
        {/* Back */}
        <Link href="/" className="inline-flex items-center text-emerald-300 hover:text-amber-400 mb-8 transition-colors group mt-16 md:mt-0">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center mr-3" style={{ background: 'rgba(6,78,59,0.5)', border: '1px solid rgba(251,191,36,0.3)' }}>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
          </div>
          <span className="font-medium">Toutes les éditions</span>
        </Link>

        <header className="text-center mb-16 space-y-4">
          <h1 className="arabic-text text-5xl md:text-7xl font-bold text-amber-400 mb-4 leading-tight" style={{ textShadow: '0 4px 20px rgba(251,191,36,0.3)' }}>
            مشرب صافي<br />
            <span className="text-emerald-400">حزب الترقية {edition.annee}</span>
          </h1>
          <p className="text-xl md:text-2xl text-emerald-300 font-light tracking-wide">
            {edition.titre}
          </p>
          <div className="w-32 h-1 mx-auto rounded-full mt-6" style={{ background: 'linear-gradient(to right, #f59e0b, #10b981, #f59e0b)', boxShadow: '0 0 15px rgba(251,191,36,0.3)' }}></div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {jours.map((jour: any) => {
            const count = jour.sonsCount ?? 0;
            return (
              <Link key={jour.id} href={`/${annee}/jour/${jour.numero}`} className="day-card group block rounded-2xl p-6 cursor-pointer relative overflow-hidden">
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-300" style={{ background: 'linear-gradient(135deg, rgba(251,191,36,0.1), rgba(5,150,105,0.1))' }}></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-3xl font-bold text-amber-400 group-hover:text-amber-300 transition-colors">Jour {jour.numero}</span>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(6,78,59,0.5)', border: '1px solid rgba(251,191,36,0.3)' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-1">Programme</h3>
                  <p className="text-white font-medium leading-snug text-emerald-100">{jour.titre}</p>
                  <div className="mt-4 flex items-center text-xs text-emerald-400/70">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
                    </svg>
                    <span>{count} piste{count > 1 ? 's' : ''} audio</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <footer className="mt-20 text-center text-emerald-400/50 text-sm">
          <p>© {edition.annee} Mashrabuç Çâfî Hizbut-Tarqiyyah — Tous droits réservés</p>
        </footer>
      </div>
    </main>
  );
}
