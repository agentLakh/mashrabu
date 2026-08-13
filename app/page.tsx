import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen relative text-white flex flex-col items-center justify-center" style={{ background: 'linear-gradient(135deg, #022c22 0%, #064e3b 50%, #065f46 100%)' }}>
      <div className="absolute top-4 left-4 pointer-events-none">
        <img src="/mosque.png" alt="Touba" className="h-16 w-12 md:h-20 md:w-16 rounded-2xl object-cover shadow-lg" style={{ boxShadow: '0 0 20px rgba(251,191,36,0.3)' }} />
      </div>
      <div className="absolute top-4 right-4 pointer-events-none">
        <img src="/bamba.png" alt="Cheikh Ahmadou Bamba" className="h-16 w-12 md:h-20 md:w-16 rounded-2xl object-cover shadow-lg" style={{ boxShadow: '0 0 20px rgba(251,191,36,0.3)' }} />
      </div>

      <div className="scrolling-container">
        <div className="scrolling-text">بَانَ لِكُلِّ مَنْ لَهُ وِلَايَةْ * كَوْنِي لِرَبِّ الْعَالَمِينَ آيَةْ</div>
        <div className="scrolling-text">بَانَ لِكُلِّ مَنْ لَهُ وِلَايَةْ * كَوْنِي لِرَبِّ الْعَالَمِينَ آيَةْ</div>
        <div className="scrolling-text">بَانَ لِكُلِّ مَنْ لَهُ وِلَايَةْ * كَوْنِي لِرَبِّ الْعَالَمِينَ آيَةْ</div>
        <div className="scrolling-text">بَانَ لِكُلِّ مَنْ لَهُ وِلَايَةْ * كَوْنِي لِرَبِّ الْعَالَمِينَ آيَةْ</div>
      </div>
      <div className="pattern-bg fixed inset-0 pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-3xl px-4 py-20 text-center">
        <div className="mb-12">
          <h1 className="arabic-text text-5xl md:text-7xl font-bold text-amber-400 leading-tight mb-4" style={{ textShadow: '0 4px 20px rgba(251,191,36,0.3)' }}>
            مشرب صافي
          </h1>
          <p className="text-emerald-300 text-lg md:text-xl font-light tracking-wide">Hizbut-Tarqiyyah — Bibliothèque audio</p>
          <div className="w-32 h-1 mx-auto rounded-full mt-6" style={{ background: 'linear-gradient(to right, #f59e0b, #10b981, #f59e0b)' }}></div>
        </div>

        <p className="text-emerald-400/70 text-sm mb-10 uppercase tracking-wider">Choisissez une catégorie</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Ramadan */}
          <Link href="/ramadan" className="day-card group block rounded-3xl p-8 cursor-pointer relative overflow-hidden text-left">
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-300" style={{ background: 'linear-gradient(135deg, rgba(251,191,36,0.1), rgba(5,150,105,0.1))' }}></div>
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5" style={{ background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.3)' }}>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2 group-hover:text-amber-400 transition-colors">Mashrabuç Çâfî</h2>
              <p className="arabic-text text-amber-400/80 text-lg mb-3">مشرب صافي</p>
              <p className="text-emerald-400/60 text-sm leading-relaxed">Enregistrements des 30 jours de Ramadan — Hizbut-Tarqiyyah</p>
              <div className="mt-5 inline-flex items-center gap-2 text-xs text-emerald-400 px-3 py-1.5 rounded-full" style={{ background: 'rgba(6,78,59,0.5)', border: '1px solid rgba(251,191,36,0.2)' }}>
                Voir les éditions →
              </div>
            </div>
          </Link>

          {/* Magal */}
          <Link href="/magal" className="day-card group block rounded-3xl p-8 cursor-pointer relative overflow-hidden text-left">
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-300" style={{ background: 'linear-gradient(135deg, rgba(251,191,36,0.1), rgba(5,150,105,0.1))' }}></div>
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5" style={{ background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.3)' }}>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m9 9 10.5-3m0 6.553v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 1 1-.99-3.467l2.31-.66a2.25 2.25 0 0 0 1.632-2.163Zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 0 1-.99-3.467l2.31-.66A2.25 2.25 0 0 0 9 15.553Z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2 group-hover:text-amber-400 transition-colors">Magal de Touba</h2>
              <p className="arabic-text text-amber-400/80 text-lg mb-3">ماغال طوبى</p>
              <p className="text-emerald-400/60 text-sm leading-relaxed">Kourels et enregistrements des différentes éditions du Magal</p>
              <div className="mt-5 inline-flex items-center gap-2 text-xs text-emerald-400 px-3 py-1.5 rounded-full" style={{ background: 'rgba(6,78,59,0.5)', border: '1px solid rgba(251,191,36,0.2)' }}>
                Voir les éditions →
              </div>
            </div>
          </Link>
        </div>

        <footer className="mt-20 text-emerald-400/40 text-sm">
          © Mashrabuç Çâfî Hizbut-Tarqiyyah — Tous droits réservés
        </footer>
      </div>
    </main>
  );
}
