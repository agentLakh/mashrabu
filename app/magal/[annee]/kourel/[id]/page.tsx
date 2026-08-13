import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import AudioList from './AudioList';

export const revalidate = 0;

async function getData(annee: number, kourelId: number) {
  const { data: edition } = await supabase.from('editions').select('id, annee, titre').eq('annee', annee).eq('categorie', 'magal').single();
  if (!edition) return null;
  const { data: kourel } = await supabase.from('kourels').select('*').eq('id', kourelId).eq('edition_id', edition.id).single();
  if (!kourel) return null;
  const { data: sons } = await supabase.from('sons').select('*').eq('kourel_id', kourelId).order('ordre', { ascending: true });
  return { edition, kourel, sons: sons || [] };
}

export default async function KourelPage({ params }: { params: { annee: string; id: string } }) {
  const annee = parseInt(params.annee, 10);
  const kourelId = parseInt(params.id, 10);
  if (isNaN(annee) || isNaN(kourelId)) notFound();
  const data = await getData(annee, kourelId);
  if (!data) notFound();
  const { edition, kourel, sons } = data;

  return (
    <main className="min-h-screen relative" style={{ background: 'linear-gradient(135deg, #022c22 0%, #064e3b 50%, #065f46 100%)', color: 'white' }}>
      <div className="absolute top-2 right-4 z-20 pointer-events-none md:hidden">
        <img src="/mosque.png" alt="Touba" className="h-16 w-12 rounded-2xl object-cover object-top" />
      </div>
      <div className="scrolling-container">
        <div className="scrolling-text">بَانَ لِكُلِّ مَنْ لَهُ وِلَايَةْ * كَوْنِي لِرَبِّ الْعَالَمِينَ آيَةْ</div>
        <div className="scrolling-text">بَانَ لِكُلِّ مَنْ لَهُ وِلَايَةْ * كَوْنِي لِرَبِّ الْعَالَمِينَ آيَةْ</div>
        <div className="scrolling-text">بَانَ لِكُلِّ مَنْ لَهُ وِلَايَةْ * كَوْنِي لِرَبِّ الْعَالَمِينَ آيَةْ</div>
      </div>
      <div className="pattern-bg fixed inset-0 pointer-events-none"></div>

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-5xl">
        <Link href={`/magal/${annee}`} className="inline-flex items-center text-emerald-300 hover:text-amber-400 mb-8 transition-colors mt-16 md:mt-0">
          <div className="w-10 h-10 rounded-full flex items-center justify-center mr-3" style={{ background: 'rgba(6,78,59,0.5)', border: '1px solid rgba(251,191,36,0.3)' }}>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
          </div>
          <span className="font-medium">Retour au Magal {annee}</span>
        </Link>

        <header className="day-header-box mb-10 rounded-3xl p-8 border backdrop-blur-sm" style={{ background: 'linear-gradient(to right, rgba(6,78,59,0.6), rgba(6,78,59,0.4))', borderColor: 'rgba(251,191,36,0.2)', boxShadow: '0 10px 40px -10px rgba(251,191,36,0.2)' }}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex-1">
              <div className="inline-block px-4 py-1 rounded-full text-amber-400 text-xs font-bold uppercase tracking-wider mb-4" style={{ background: 'rgba(245,158,11,0.2)', border: '1px solid rgba(251,191,36,0.3)' }}>
                Kourel #{kourel.ordre} — Magal {edition.annee}
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-2 leading-tight">{kourel.nom}</h1>
              {kourel.nom_ar && <h2 className="arabic-text text-xl sm:text-2xl text-amber-400 font-bold">{kourel.nom_ar}</h2>}
              <p className="text-emerald-300 mt-4 text-sm">{edition.titre}</p>
            </div>
            <div className="w-20 h-20 rounded-2xl flex flex-col items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(5,150,105,0.2))', border: '2px solid rgba(251,191,36,0.3)' }}>
              <span className="text-3xl font-bold text-amber-400">{String(kourel.ordre).padStart(2, '0')}</span>
            </div>
          </div>
        </header>

        <AudioList sons={sons} jourTitre={kourel.nom} jourNumero={kourel.ordre} annee={annee} />
        <div className="h-24 md:h-8"></div>
        <footer className="mt-12 text-center text-emerald-400/40 text-sm pb-8">
          © {edition.annee} Magal de Touba — Hizbut-Tarqiyyah
        </footer>
      </div>
    </main>
  );
}
