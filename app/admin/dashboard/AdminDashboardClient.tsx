'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Son = { id: number; nom: string; type: string; duree: string; url: string; ordre: number };
type Jour = { id: number; numero: number; titre: string; titre_ar?: string; sonsCount?: number; date_programme: string; edition_id: number };
type Edition = { id: number; annee: number; titre: string; titre_ar?: string };

export default function AdminDashboardClient({ editions: initialEditions = [], joursParEdition: initialJours = {} }: { editions: Edition[]; joursParEdition: Record<number, Jour[]> }) {
  const router = useRouter();

  const [editionsList, setEditionsList] = useState<Edition[]>(initialEditions);
  const [joursData, setJoursData] = useState<Record<number, Jour[]>>(initialJours);
  const [selectedEdition, setSelectedEdition] = useState<Edition | null>(initialEditions[0] || null);

  const [showNewEdition, setShowNewEdition] = useState(false);
  const [newAnnee, setNewAnnee] = useState('');
  const [newTitre, setNewTitre] = useState('');
  const [newTitreAr, setNewTitreAr] = useState('');
  const [newDatePremierJour, setNewDatePremierJour] = useState('');
  const [creatingEdition, setCreatingEdition] = useState(false);
  const [createError, setCreateError] = useState('');

  const [selectedJour, setSelectedJour] = useState<Jour | null>(null);
  const [sons, setSons] = useState<Son[]>([]);
  const [loadingSons, setLoadingSons] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [editingJour, setEditingJour] = useState(false);

  const [playingAudio, setPlayingAudio] = useState<HTMLAudioElement | null>(null);
  const [playingSonId, setPlayingSonId] = useState<number | null>(null);

  const [formNom, setFormNom] = useState('');
  const [formType, setFormType] = useState('Kourel');
  const [formFile, setFormFile] = useState<File | null>(null);
  const [formError, setFormError] = useState('');
  const [jourTitre, setJourTitre] = useState('');
  const [jourTitreAr, setJourTitreAr] = useState('');

  const jours = selectedEdition ? (joursData[selectedEdition.id] || []) : [];

  async function reloadAll() {
    const { data: eds } = await supabase
      .from('editions')
      .select('*')
      .order('annee', { ascending: false });

    if (!eds || eds.length === 0) { setEditionsList([]); setJoursData({}); return; }

    setEditionsList(eds);
    setSelectedEdition((prev) => prev ? (eds.find(e => e.id === prev.id) ?? eds[0]) : eds[0]);

    const newJoursData: Record<number, Jour[]> = {};
    for (const ed of eds) {
      const { data: joursEd } = await supabase
        .from('jours')
        .select('*')
        .eq('edition_id', ed.id)
        .order('numero', { ascending: true });

      if (joursEd) {
        const withCount = await Promise.all(
          joursEd.map(async (jour) => {
            const { count } = await supabase
              .from('sons')
              .select('*', { count: 'exact', head: true })
              .eq('jour_id', jour.id);
            return { ...jour, sonsCount: count ?? 0 };
          })
        );
        newJoursData[ed.id] = withCount;
      }
    }
    setJoursData(newJoursData);
  }

  useEffect(() => { reloadAll(); }, []);

  async function createEdition(e: React.FormEvent) {
    e.preventDefault();
    setCreatingEdition(true);
    setCreateError('');

    // Crée l'édition
    const { data: edition, error: edError } = await supabase
      .from('editions')
      .insert({
        annee: parseInt(newAnnee),
        titre: newTitre || `Mashrabuç Çâfî ${newAnnee}`,
        titre_ar: newTitreAr || '',
        actif: true,
      })
      .select()
      .single();

    if (edError || !edition) {
      setCreateError(edError?.message || 'Erreur création édition');
      setCreatingEdition(false);
      return;
    }

    // Génère les 30 jours un par un pour éviter les erreurs de batch
    const startDate = new Date(newDatePremierJour + 'T12:00:00'); // midi pour éviter les problèmes de timezone
    const joursToInsert = [];

    for (let i = 0; i < 30; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      joursToInsert.push({
        edition_id: edition.id,
        numero: i + 1,
        titre: `Kourel Jour ${i + 1}`,
        titre_ar: '',
        date_programme: `${yyyy}-${mm}-${dd}`,
      });
    }

    const { error: joursError } = await supabase.from('jours').insert(joursToInsert);

    if (joursError) {
      setCreateError(joursError.message);
      setCreatingEdition(false);
      return;
    }

    setCreatingEdition(false);
    setShowNewEdition(false);
    setNewAnnee(''); setNewTitre(''); setNewTitreAr(''); setNewDatePremierJour('');
    await reloadAll();
    setSelectedEdition(edition);
    setSelectedJour(null);
    setSons([]);
  }

  async function deleteEdition(edition: Edition) {
    if (!confirm(`Supprimer l'édition ${edition.annee} et TOUS ses jours et sons ? Cette action est irréversible.`)) return;

    // Récupère tous les jours de l'édition
    const { data: joursEd } = await supabase.from('jours').select('id').eq('edition_id', edition.id);

    if (joursEd && joursEd.length > 0) {
      const jourIds = joursEd.map(j => j.id);
      // Supprime tous les sons de ces jours
      await supabase.from('sons').delete().in('jour_id', jourIds);
      // Supprime tous les jours
      await supabase.from('jours').delete().eq('edition_id', edition.id);
    }

    // Supprime l'édition
    await supabase.from('editions').delete().eq('id', edition.id);

    if (selectedEdition?.id === edition.id) {
      setSelectedEdition(null);
      setSelectedJour(null);
      setSons([]);
    }

    await reloadAll();
  }

  async function selectJour(jour: Jour) {
    setSelectedJour(jour);
    setJourTitre(jour.titre);
    setJourTitreAr(jour.titre_ar || '');
    setShowForm(false);
    setEditingJour(false);
    setSons([]);
    setLoadingSons(true);
    const { data, error } = await supabase
      .from('sons')
      .select('*')
      .eq('jour_id', jour.id)
      .order('ordre', { ascending: true });
    if (!error) setSons(data || []);
    setLoadingSons(false);
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!formFile || !selectedJour) return;
    setUploading(true);
    setFormError('');
    setUploadProgress('Upload en cours...');

    const fd = new FormData();
    fd.append('file', formFile);
    fd.append('nom', formNom);
    fd.append('type', formType);
    fd.append('jour_id', String(selectedJour.id));
    fd.append('ordre', String(sons.length + 1));

    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    const data = await res.json();

    if (!res.ok) {
      setFormError(data.error || "Erreur lors de l'upload");
      setUploading(false);
      setUploadProgress('');
      return;
    }

    setUploadProgress('✓ Ajouté avec succès !');
    setUploading(false);

    const { data: fresh } = await supabase
      .from('sons')
      .select('*')
      .eq('jour_id', selectedJour.id)
      .order('ordre', { ascending: true });
    setSons(fresh || []);

    setFormNom(''); setFormType('Kourel'); setFormFile(null);
    setTimeout(() => { setUploadProgress(''); setShowForm(false); }, 1000);
  }

  async function deleteSon(sonId: number) {
    if (!confirm('Supprimer ce son ?')) return;
    setSons((prev) => prev.filter((s) => s.id !== sonId));
    await supabase.from('sons').delete().eq('id', sonId);
  }

  async function saveJourTitre() {
    if (!selectedJour) return;
    await supabase.from('jours').update({ titre: jourTitre, titre_ar: jourTitreAr }).eq('id', selectedJour.id);
    setEditingJour(false);
    await reloadAll();
  }

  function togglePlay(son: Son) {
    if (playingSonId === son.id) {
      playingAudio?.pause();
      setPlayingAudio(null);
      setPlayingSonId(null);
    } else {
      playingAudio?.pause();
      const a = new Audio(son.url);
      a.play();
      a.onended = () => { setPlayingAudio(null); setPlayingSonId(null); };
      setPlayingAudio(a);
      setPlayingSonId(son.id);
    }
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin');
  }

  return (
    <main className="min-h-screen" style={{ background: 'linear-gradient(135deg, #022c22 0%, #064e3b 50%, #065f46 100%)', color: 'white' }}>
      {/* Top bar */}
      <div className="sticky top-0 z-30 px-4 py-3 flex items-center justify-between" style={{ background: 'rgba(2,44,34,0.95)', borderBottom: '1px solid rgba(251,191,36,0.2)', backdropFilter: 'blur(10px)' }}>
        <div className="flex items-center gap-3">
          <h1 className="arabic-text text-xl font-bold text-amber-400">مشرب صافي</h1>
          <span className="text-emerald-400/60 text-sm">— Administration</span>
        </div>
        <div className="flex items-center gap-3">
          <a href="/" target="_blank" className="text-xs text-emerald-400 hover:text-amber-400 transition-colors">Voir le site ↗</a>
          <button onClick={logout} className="text-xs px-3 py-1.5 rounded-lg text-red-400" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
            Déconnexion
          </button>
        </div>
      </div>

      <div className="flex h-[calc(100vh-52px)]">
        {/* Sidebar */}
        <aside className="w-64 flex-shrink-0 overflow-y-auto flex flex-col" style={{ background: 'rgba(2,44,34,0.6)', borderRight: '1px solid rgba(251,191,36,0.1)' }}>

          {/* Editions */}
          <div className="p-4 border-b" style={{ borderColor: 'rgba(251,191,36,0.1)' }}>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xs font-bold text-emerald-400/70 uppercase tracking-wider">Éditions</h2>
              <button
                onClick={() => setShowNewEdition(!showNewEdition)}
                className="text-xs px-2 py-1 rounded text-amber-400"
                style={{ background: 'rgba(251,191,36,0.1)' }}
              >
                + Nouvelle
              </button>
            </div>

            {showNewEdition && (
              <form onSubmit={createEdition} className="space-y-2 mt-3 p-3 rounded-lg" style={{ background: 'rgba(6,78,59,0.3)', border: '1px solid rgba(251,191,36,0.2)' }}>
                <input
                  value={newAnnee}
                  onChange={(e) => setNewAnnee(e.target.value)}
                  className="w-full px-2 py-1.5 rounded text-white text-xs outline-none"
                  style={{ background: 'rgba(2,44,34,0.6)', border: '1px solid rgba(251,191,36,0.2)' }}
                  placeholder="Année (ex: 2027)" type="number" required
                />
                <input
                  value={newTitre}
                  onChange={(e) => setNewTitre(e.target.value)}
                  className="w-full px-2 py-1.5 rounded text-white text-xs outline-none"
                  style={{ background: 'rgba(2,44,34,0.6)', border: '1px solid rgba(251,191,36,0.2)' }}
                  placeholder="Titre (optionnel)"
                />
                <input
                  value={newDatePremierJour}
                  onChange={(e) => setNewDatePremierJour(e.target.value)}
                  className="w-full px-2 py-1.5 rounded text-white text-xs outline-none"
                  style={{ background: 'rgba(2,44,34,0.6)', border: '1px solid rgba(251,191,36,0.2)' }}
                  type="date" required
                />
                <p className="text-emerald-400/50 text-xs">Date du 1er jour de Ramadan</p>
                {createError && <p className="text-red-400 text-xs">{createError}</p>}
                <button
                  type="submit"
                  disabled={creatingEdition}
                  className="w-full py-1.5 rounded text-xs font-medium text-white"
                  style={{ background: creatingEdition ? 'rgba(5,150,105,0.3)' : 'rgba(5,150,105,0.6)' }}
                >
                  {creatingEdition ? 'Création en cours...' : 'Créer les 30 jours'}
                </button>
              </form>
            )}

            <div className="space-y-1 mt-2">
              {editionsList.map((edition) => (
                <div key={edition.id} className="flex items-center gap-1">
                  <button
                    onClick={() => { setSelectedEdition(edition); setSelectedJour(null); setSons([]); }}
                    className="flex-1 text-left px-3 py-2 rounded-lg transition-all text-sm"
                    style={{
                      background: selectedEdition?.id === edition.id ? 'rgba(251,191,36,0.2)' : 'transparent',
                      border: selectedEdition?.id === edition.id ? '1px solid rgba(251,191,36,0.4)' : '1px solid transparent',
                    }}
                  >
                    <span className="font-bold text-amber-400">{edition.annee}</span>
                    <span className="text-emerald-400/60 text-xs ml-2">{joursData[edition.id]?.length ?? 0} jours</span>
                  </button>
                  <button
                    onClick={() => deleteEdition(edition)}
                    className="p-1.5 rounded text-red-400/60 hover:text-red-400 transition-colors flex-shrink-0"
                    style={{ background: 'rgba(239,68,68,0.05)' }}
                    title="Supprimer l'édition"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Jours */}
          <div className="p-4 flex-1 overflow-y-auto">
            {selectedEdition && (
              <>
                <h2 className="text-xs font-bold text-emerald-400/70 uppercase tracking-wider mb-3">
                  Jours — {selectedEdition.annee}
                </h2>
                <div className="space-y-1">
                  {jours.map((jour) => {
                    const isSelected = selectedJour?.id === jour.id;
                    return (
                      <button
                        key={jour.id}
                        onClick={() => selectJour(jour)}
                        className="w-full text-left px-3 py-2.5 rounded-lg transition-all text-sm"
                        style={{
                          background: isSelected ? 'rgba(251,191,36,0.15)' : 'transparent',
                          border: isSelected ? '1px solid rgba(251,191,36,0.3)' : '1px solid transparent',
                        }}
                      >
                        <div className="font-semibold text-amber-400">Jour {jour.numero}</div>
                        <div className="text-emerald-400/70 text-xs truncate">{jour.titre}</div>
                        <div className="text-emerald-400/40 text-xs">{jour.sonsCount ?? 0} piste{(jour.sonsCount ?? 0) > 1 ? 's' : ''}</div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!selectedJour ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-emerald-400/50">
                <p className="text-lg">← Sélectionne un jour pour commencer</p>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="rounded-2xl p-6" style={{ background: 'rgba(6,78,59,0.4)', border: '1px solid rgba(251,191,36,0.2)' }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    {editingJour ? (
                      <div className="space-y-3">
                        <input value={jourTitre} onChange={(e) => setJourTitre(e.target.value)} className="w-full px-3 py-2 rounded-lg text-white outline-none text-sm" style={{ background: 'rgba(2,44,34,0.6)', border: '1px solid rgba(251,191,36,0.3)' }} placeholder="Titre français" />
                        <input value={jourTitreAr} onChange={(e) => setJourTitreAr(e.target.value)} className="w-full px-3 py-2 rounded-lg text-amber-400 outline-none text-sm arabic-text" style={{ background: 'rgba(2,44,34,0.6)', border: '1px solid rgba(251,191,36,0.3)', direction: 'rtl' }} placeholder="العنوان بالعربية" />
                        <div className="flex gap-2">
                          <button onClick={saveJourTitre} className="px-4 py-1.5 rounded-lg text-sm font-medium text-white" style={{ background: 'rgba(5,150,105,0.6)' }}>Sauvegarder</button>
                          <button onClick={() => setEditingJour(false)} className="px-4 py-1.5 rounded-lg text-sm text-emerald-400" style={{ background: 'rgba(6,78,59,0.4)' }}>Annuler</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="text-xs text-amber-400/70 uppercase tracking-wider mb-1">Jour {selectedJour.numero} — {selectedJour.date_programme} — Édition {selectedEdition?.annee}</div>
                        <h2 className="text-2xl font-bold text-white">{selectedJour.titre}</h2>
                        {selectedJour.titre_ar && <p className="arabic-text text-amber-400 mt-1">{selectedJour.titre_ar}</p>}
                      </>
                    )}
                  </div>
                  {!editingJour && (
                    <button onClick={() => setEditingJour(true)} className="flex-shrink-0 text-xs px-3 py-1.5 rounded-lg text-amber-400" style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)' }}>
                      Modifier
                    </button>
                  )}
                </div>
              </div>

              <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(2,44,34,0.4)', border: '1px solid rgba(251,191,36,0.1)' }}>
                <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(251,191,36,0.1)' }}>
                  <h3 className="font-semibold text-white">{sons.length} piste{sons.length > 1 ? 's' : ''}</h3>
                  <button
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg font-medium text-white"
                    style={{ background: showForm ? 'rgba(239,68,68,0.2)' : 'linear-gradient(135deg, #059669, #047857)', border: '1px solid rgba(251,191,36,0.3)' }}
                  >
                    {showForm ? '✕ Annuler' : '+ Ajouter un son'}
                  </button>
                </div>

                {showForm && (
                  <form onSubmit={handleUpload} className="p-6 space-y-4" style={{ borderBottom: '1px solid rgba(251,191,36,0.1)', background: 'rgba(6,78,59,0.2)' }}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-emerald-300 text-xs mb-1.5">Nom du son *</label>
                        <input value={formNom} onChange={(e) => setFormNom(e.target.value)} className="w-full px-3 py-2 rounded-lg text-white outline-none text-sm" style={{ background: 'rgba(2,44,34,0.6)', border: '1px solid rgba(251,191,36,0.2)' }} placeholder="ex: Yakhyra Dayfi" required />
                      </div>
                      <div>
                        <label className="block text-emerald-300 text-xs mb-1.5">Type</label>
                        <select value={formType} onChange={(e) => setFormType(e.target.value)} className="w-full px-3 py-2 rounded-lg text-white outline-none text-sm" style={{ background: 'rgba(2,44,34,0.8)', border: '1px solid rgba(251,191,36,0.2)' }}>
                          <option>Kourel</option><option>Khassida</option><option>Awrade</option><option>Conférence</option><option>Zikr</option><option>Audio</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-emerald-300 text-xs mb-1.5">Fichier audio (MP3) *</label>
                      <input type="file" accept="audio/*,.mp3,.m4a,.ogg,.wav" onChange={(e) => setFormFile(e.target.files?.[0] || null)} className="w-full text-sm text-emerald-300 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:text-white file:bg-emerald-700 hover:file:bg-emerald-600" required />
                    </div>
                    {formError && <p className="text-red-400 text-sm">{formError}</p>}
                    {uploadProgress && <p className="text-emerald-400 text-sm">{uploadProgress}</p>}
                    <button type="submit" disabled={uploading} className="w-full py-2.5 rounded-lg font-semibold text-white text-sm" style={{ background: uploading ? 'rgba(5,150,105,0.4)' : 'linear-gradient(135deg, #059669, #047857)' }}>
                      {uploading ? 'Upload en cours...' : 'Uploader et ajouter'}
                    </button>
                  </form>
                )}

                {loadingSons ? (
                  <div className="p-8 text-center text-emerald-400/50 text-sm">Chargement...</div>
                ) : sons.length === 0 ? (
                  <div className="p-8 text-center text-emerald-400/40 text-sm">Aucun son pour ce jour. Ajoute le premier !</div>
                ) : (
                  <div className="divide-y divide-amber-400/10">
                    {sons.map((son) => (
                      <div key={son.id} className="px-6 py-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold text-amber-400" style={{ background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.2)' }}>
                            {String(son.ordre).padStart(2, '0')}
                          </div>
                          <div className="min-w-0">
                            <div className="text-white text-sm font-medium truncate">{son.nom}</div>
                            <div className="text-emerald-400/60 text-xs">{son.type} • {son.duree}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button onClick={() => togglePlay(son)} className="text-xs px-2 py-1 rounded transition-colors" style={{ background: 'rgba(6,78,59,0.5)', color: playingSonId === son.id ? '#fbbf24' : '#34d399' }}>
                            {playingSonId === son.id ? 'Pause' : 'Écouter'}
                          </button>
                          <button onClick={() => deleteSon(son.id)} className="text-xs px-2 py-1 rounded text-red-400" style={{ background: 'rgba(239,68,68,0.1)' }}>
                            Supprimer
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}