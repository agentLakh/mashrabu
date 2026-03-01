import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export const revalidate = 0;

async function getEditions() {
  const { data: editions } = await supabase
    .from('editions')
    .select('*')
    .eq('actif', true)
    .order('annee', { ascending: false });
  return editions || [];
}

export default async function HomePage() {
  const editions = await getEditions();

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

      <div className="relative z-10 container mx-auto px-4 py-12 max-w-4xl">
        <header className="text-center mb-16 space-y-4">
          <div className="inline-block p-3 rounded-full mb-4 backdrop-blur-sm" style={{ background: 'rgba(6,78,59,0.5)', border: '1px solid rgba(251,191,36,0.3)' }}>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m9 9 10.5-3m0 6.553v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 1 1-.99-3.467l2.31-.66a2.25 2.25 0 0 0 1.632-2.163Zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 0 1-.99-3.467l2.31-.66A2.25 2.25 0 0 0 9 15.553Z" />
            </svg>
          </div>
          <h1 className="arabic-text text-5xl md:text-7xl font-bold text-amber-400 mb-4 leading-tight" style={{ textShadow: '0 4px 20px rgba(251,191,36,0.3)' }}>
            مشرب صافي<br />
            <span className="text-emerald-400">حزب الترقية</span>
          </h1>
          <p className="text-xl md:text-2xl text-emerald-300 font-light tracking-wide">
            Mashrabuç Çâfî — Hizbut-Tarqiyyah
          </p>
          <p className="text-emerald-400/70 text-sm">Sélectionne une édition pour accéder aux enregistrements</p>
          <div className="w-32 h-1 mx-auto rounded-full mt-6" style={{ background: 'linear-gradient(to right, #f59e0b, #10b981, #f59e0b)' }}></div>
        </header>

        {/* Grille des éditions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {editions.map((edition: any) => (
            <Link
              key={edition.id}
              href={`/${edition.annee}`}
              className="day-card group block rounded-2xl p-8 cursor-pointer relative overflow-hidden text-center"
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-300" style={{ background: 'linear-gradient(135deg, rgba(251,191,36,0.1), rgba(5,150,105,0.1))' }}></div>
              <div className="relative z-10">
                <div className="text-6xl font-bold text-amber-400 group-hover:text-amber-300 transition-colors mb-3">
                  {edition.annee}
                </div>
                <p className="text-emerald-300 font-medium">{edition.titre}</p>
                {edition.titre_ar && (
                  <p className="arabic-text text-amber-400/70 text-sm mt-1">{edition.titre_ar}</p>
                )}
                <div className="mt-4 inline-flex items-center gap-2 text-xs text-emerald-400/70 px-3 py-1 rounded-full" style={{ background: 'rgba(6,78,59,0.5)', border: '1px solid rgba(251,191,36,0.2)' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
                  </svg>
                  Voir les 30 jours
                </div>
              </div>
            </Link>
          ))}

          {editions.length === 0 && (
            <div className="col-span-3 text-center text-emerald-400/50 py-20">
              <p>Aucune édition disponible pour le moment.</p>
            </div>
          )}
        </div>

        <footer className="mt-20 text-center text-emerald-400/50 text-sm">
          <p>© Mashrabuç Çâfî Hizbut-Tarqiyyah — Tous droits réservés</p>
        </footer>
      </div>
    </main>
  );
}
