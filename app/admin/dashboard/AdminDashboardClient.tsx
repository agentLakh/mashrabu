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
type Kourel = { id: number; nom: string; nom_ar?: string; ordre: number; edition_id: number; sonsCount?: number };
type Edition = { id: number; annee: number; titre: string; titre_ar?: string; categorie: string };

export default function AdminDashboardClient({ editions: init = [], joursParEdition: initJours = {}, koureIsParEdition: initKourels = {} }: {
  editions: Edition[];
  joursParEdition: Record<number, Jour[]>;
  koureIsParEdition: Record<number, Kourel[]>;
}) {
  const router = useRouter();

  const [editionsList, setEditionsList] = useState<Edition[]>(init);
  const [joursData, setJoursData] = useState<Record<number, Jour[]>>(initJours);
  const [kourelData, setKourelData] = useState<Record<number, Kourel[]>>(initKourels);
  const [selectedEdition, setSelectedEdition] = useState<Edition | null>(null);

  const [showNewEdition, setShowNewEdition] = useState(false);
  const [newAnnee, setNewAnnee] = useState('');
  const [newTitre, setNewTitre] = useState('');
  const [newTitreAr, setNewTitreAr] = useState('');
  const [newDatePremierJour, setNewDatePremierJour] = useState('');
  const [newCategorie, setNewCategorie] = useState<'ramadan' | 'magal'>('ramadan');
  const [creatingEdition, setCreatingEdition] = useState(false);
  const [createError, setCreateError] = useState('');

  const [selectedJour, setSelectedJour] = useState<Jour | null>(null);
  const [selectedKourel, setSelectedKourel] = useState<Kourel | null>(null);
  const [sons, setSons] = useState<Son[]>([]);
  const [loadingSons, setLoadingSons] = useState(false);

  const [showKourelForm, setShowKourelForm] = useState(false);
  const [newKourelNom, setNewKourelNom] = useState('');
  const [newKourelNomAr, setNewKourelNomAr] = useState('');
  const [addingKourel, setAddingKourel] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [formNom, setFormNom] = useState('');
  const [formType, setFormType] = useState('Kourel');
  const [formFile, setFormFile] = useState<File | null>(null);
  const [formError, setFormError] = useState('');

  const [editingTitre, setEditingTitre] = useState(false);
  const [editTitre, setEditTitre] = useState('');
  const [editTitreAr, setEditTitreAr] = useState('');

  const [playingAudio, setPlayingAudio] = useState<HTMLAudioElement | null>(null);
  const [playingSonId, setPlayingSonId] = useState<number | null>(null);

  const isRamadan = selectedEdition?.categorie === 'ramadan';
  const isMagal = selectedEdition?.categorie === 'magal';
  const jours = selectedEdition ? (joursData[selectedEdition.id] || []) : [];
  const kourels = selectedEdition ? (kourelData[selectedEdition.id] || []) : [];

  const ramadanEditions = editionsList.filter(e => e.categorie === 'ramadan');
  const magalEditions = editionsList.filter(e => e.categorie === 'magal');

  async function reloadAll(selectEditionId?: number) {
    const { data: eds } = await supabase.from('editions').select('*').order('annee', { ascending: false });
    if (!eds || eds.length === 0) { setEditionsList([]); return; }
    setEditionsList(eds);

    if (selectEditionId) {
      const found = eds.find(e => e.id === selectEditionId);
      if (found) setSelectedEdition(found);
    } else {
      setSelectedEdition(prev => prev ? (eds.find(e => e.id === prev.id) ?? null) : null);
    }

    const newJours: Record<number, Jour[]> = {};
    const newKourels: Record<number, Kourel[]> = {};

    for (const ed of eds) {
      if (ed.categorie === 'ramadan') {
        const { data: js } = await supabase.from('jours').select('*').eq('edition_id', ed.id).order('numero', { ascending: true });
        if (js) {
          const withCount = await Promise.all(js.map(async j => {
            const { count } = await supabase.from('sons').select('*', { count: 'exact', head: true }).eq('jour_id', j.id);
            return { ...j, sonsCount: count ?? 0 };
          }));
          newJours[ed.id] = withCount;
        }
      } else {
        const { data: ks } = await supabase.from('kourels').select('*').eq('edition_id', ed.id).order('ordre', { ascending: true });
        if (ks) {
          const withCount = await Promise.all(ks.map(async k => {
            const { count } = await supabase.from('sons').select('*', { count: 'exact', head: true }).eq('kourel_id', k.id);
            return { ...k, sonsCount: count ?? 0 };
          }));
          newKourels[ed.id] = withCount;
        }
      }
    }
    setJoursData(newJours);
    setKourelData(newKourels);
  }

  useEffect(() => { reloadAll(); }, []);

  async function createEdition(e: React.FormEvent) {
    e.preventDefault();
    setCreatingEdition(true); setCreateError('');

    const { data: edition, error } = await supabase.from('editions').insert({
      annee: parseInt(newAnnee),
      titre: newTitre || `${newCategorie === 'ramadan' ? 'Mashrabuç Çâfî' : 'Magal Touba'} ${newAnnee}`,
      titre_ar: newTitreAr || '',
      actif: true,
      categorie: newCategorie,
    }).select().single();

    if (error || !edition) { setCreateError(error?.message || 'Erreur création'); setCreatingEdition(false); return; }

    if (newCategorie === 'ramadan' && newDatePremierJour) {
      const joursToInsert = [];
      const startDate = new Date(newDatePremierJour + 'T12:00:00');
      for (let i = 0; i < 30; i++) {
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + i);
        const yyyy = d.getFullYear(), mm = String(d.getMonth() + 1).padStart(2, '0'), dd = String(d.getDate()).padStart(2, '0');
        joursToInsert.push({ edition_id: edition.id, numero: i + 1, titre: `Kourel Jour ${i + 1}`, titre_ar: '', date_programme: `${yyyy}-${mm}-${dd}` });
      }
      const { error: je } = await supabase.from('jours').insert(joursToInsert);
      if (je) { setCreateError(je.message); setCreatingEdition(false); return; }
    }

    setCreatingEdition(false);
    setShowNewEdition(false);
    setNewAnnee(''); setNewTitre(''); setNewTitreAr(''); setNewDatePremierJour(''); setNewCategorie('ramadan');
    setSelectedJour(null); setSelectedKourel(null); setSons([]);
    await reloadAll(edition.id);
  }

  async function deleteEdition(edition: Edition) {
    if (!confirm(`Supprimer l'édition ${edition.annee} (${edition.categorie}) et tout son contenu ? Irréversible.`)) return;
    const { data: joursEd } = await supabase.from('jours').select('id').eq('edition_id', edition.id);
    if (joursEd?.length) { await supabase.from('sons').delete().in('jour_id', joursEd.map(j => j.id)); await supabase.from('jours').delete().eq('edition_id', edition.id); }
    const { data: koursEd } = await supabase.from('kourels').select('id').eq('edition_id', edition.id);
    if (koursEd?.length) { await supabase.from('sons').delete().in('kourel_id', koursEd.map(k => k.id)); await supabase.from('kourels').delete().eq('edition_id', edition.id); }
    await supabase.from('editions').delete().eq('id', edition.id);
    if (selectedEdition?.id === edition.id) { setSelectedEdition(null); setSelectedJour(null); setSelectedKourel(null); setSons([]); }
    await reloadAll();
  }

  async function addKourel(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedEdition || !newKourelNom) return;
    setAddingKourel(true);
    const nextOrdre = (kourelData[selectedEdition.id]?.length ?? 0) + 1;
    await supabase.from('kourels').insert({ edition_id: selectedEdition.id, nom: newKourelNom, nom_ar: newKourelNomAr, ordre: nextOrdre });
    setNewKourelNom(''); setNewKourelNomAr(''); setShowKourelForm(false); setAddingKourel(false);
    await reloadAll();
  }

  async function deleteKourel(kourelId: number) {
    if (!confirm('Supprimer ce kourel et tous ses sons ?')) return;
    await supabase.from('sons').delete().eq('kourel_id', kourelId);
    await supabase.from('kourels').delete().eq('id', kourelId);
    if (selectedKourel?.id === kourelId) { setSelectedKourel(null); setSons([]); }
    await reloadAll();
  }

  async function selectJour(jour: Jour) {
    setSelectedJour(jour); setSelectedKourel(null);
    setEditTitre(jour.titre); setEditTitreAr(jour.titre_ar || '');
    setShowForm(false); setEditingTitre(false); setSons([]); setLoadingSons(true);
    const { data } = await supabase.from('sons').select('*').eq('jour_id', jour.id).order('ordre', { ascending: true });
    setSons(data || []); setLoadingSons(false);
  }

  async function selectKourel(kourel: Kourel) {
    setSelectedKourel(kourel); setSelectedJour(null);
    setEditTitre(kourel.nom); setEditTitreAr(kourel.nom_ar || '');
    setShowForm(false); setEditingTitre(false); setSons([]); setLoadingSons(true);
    const { data } = await supabase.from('sons').select('*').eq('kourel_id', kourel.id).order('ordre', { ascending: true });
    setSons(data || []); setLoadingSons(false);
  }

  async function saveTitre() {
    if (selectedJour) await supabase.from('jours').update({ titre: editTitre, titre_ar: editTitreAr }).eq('id', selectedJour.id);
    else if (selectedKourel) await supabase.from('kourels').update({ nom: editTitre, nom_ar: editTitreAr }).eq('id', selectedKourel.id);
    setEditingTitre(false); await reloadAll();
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!formFile || (!selectedJour && !selectedKourel)) return;
    setUploading(true); setFormError(''); setUploadProgress('Préparation...');
    try {
      const sigRes = await fetch('/api/upload');
      const { signature, timestamp, folder, cloud_name, api_key } = await sigRes.json();
      const fd = new FormData();
      fd.append('file', formFile); fd.append('api_key', api_key);
      fd.append('timestamp', String(timestamp)); fd.append('signature', signature);
      fd.append('folder', folder); fd.append('resource_type', 'video');

      const cloudRes = await new Promise<any>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloud_name}/video/upload`);
        xhr.upload.onprogress = ev => {
          if (ev.lengthComputable) {
            const pct = Math.round((ev.loaded / ev.total) * 100);
            setUploadProgress(pct < 100 ? `Envoi... ${pct}%` : '⚙️ Traitement Cloudinary...');
          }
        };
        xhr.onload = () => {
          if (xhr.status === 200) resolve(JSON.parse(xhr.responseText));
          else { try { reject(new Error(JSON.parse(xhr.responseText)?.error?.message || 'Erreur')); } catch { reject(new Error('Erreur Cloudinary')); } }
        };
        xhr.onerror = () => reject(new Error('Erreur réseau'));
        xhr.send(fd);
      });

      setUploadProgress('💾 Sauvegarde...');
      const body: any = { nom: formNom, type: formType, ordre: sons.length + 1, url: cloudRes.secure_url, duration: cloudRes.duration || 0 };
      if (selectedJour) body.jour_id = selectedJour.id;
      if (selectedKourel) body.kourel_id = selectedKourel.id;

      const saveRes = await fetch('/api/upload', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!saveRes.ok) throw new Error('Erreur sauvegarde');

      setUploadProgress('✓ Ajouté !'); setUploading(false);

      const { data: fresh } = await (selectedJour
        ? supabase.from('sons').select('*').eq('jour_id', selectedJour.id)
        : supabase.from('sons').select('*').eq('kourel_id', selectedKourel!.id)
      ).order('ordre', { ascending: true });
      setSons(fresh || []);

      setFormNom(''); setFormType('Kourel'); setFormFile(null);
      setTimeout(() => { setUploadProgress(''); setShowForm(false); }, 1000);
    } catch (err: any) { setFormError(err.message); setUploading(false); setUploadProgress(''); }
  }

  async function deleteSon(sonId: number) {
    if (!confirm('Supprimer ce son ?')) return;
    setSons(prev => prev.filter(s => s.id !== sonId));
    await supabase.from('sons').delete().eq('id', sonId);
  }

  function togglePlay(son: Son) {
    if (playingSonId === son.id) { playingAudio?.pause(); setPlayingAudio(null); setPlayingSonId(null); return; }
    playingAudio?.pause();
    const a = new Audio(son.url); a.play();
    a.onended = () => { setPlayingAudio(null); setPlayingSonId(null); };
    setPlayingAudio(a); setPlayingSonId(son.id);
  }

  async function logout() { await fetch('/api/auth/logout', { method: 'POST' }); router.push('/admin'); }

  const selectedItem = selectedJour || selectedKourel;
  const selectedItemLabel = selectedJour ? `Jour ${selectedJour.numero}` : selectedKourel ? `Kourel #${selectedKourel.ordre}` : '';
  const selectedItemTitre = selectedJour?.titre || selectedKourel?.nom || '';
  const selectedItemTitreAr = selectedJour?.titre_ar || selectedKourel?.nom_ar || '';

  function EditionButton({ edition }: { edition: Edition }) {
    const isSel = selectedEdition?.id === edition.id;
    const count = edition.categorie === 'ramadan' ? (joursData[edition.id]?.length ?? 0) : (kourelData[edition.id]?.length ?? 0);
    return (
      <div className="flex items-center gap-1">
        <button
          onClick={() => { setSelectedEdition(edition); setSelectedJour(null); setSelectedKourel(null); setSons([]); }}
          className="flex-1 text-left px-3 py-2 rounded-lg transition-all text-sm"
          style={{ background: isSel ? 'rgba(251,191,36,0.2)' : 'transparent', border: isSel ? '1px solid rgba(251,191,36,0.4)' : '1px solid transparent' }}
        >
          <span className="font-bold text-amber-400">{edition.annee}</span>
          <span className="text-emerald-400/50 text-xs ml-2">{count} {edition.categorie === 'ramadan' ? 'jours' : 'kourels'}</span>
        </button>
        <button onClick={() => deleteEdition(edition)} className="p-1.5 rounded text-red-400/50 hover:text-red-400 flex-shrink-0" style={{ background: 'rgba(239,68,68,0.05)' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
        </button>
      </div>
    );
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
          <button onClick={logout} className="text-xs px-3 py-1.5 rounded-lg text-red-400" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>Déconnexion</button>
        </div>
      </div>

      <div className="flex h-[calc(100vh-52px)]">
        {/* Sidebar */}
        <aside className="w-64 flex-shrink-0 overflow-y-auto flex flex-col" style={{ background: 'rgba(2,44,34,0.6)', borderRight: '1px solid rgba(251,191,36,0.1)' }}>

          {/* Formulaire nouvelle édition */}
          <div className="p-4 border-b" style={{ borderColor: 'rgba(251,191,36,0.1)' }}>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xs font-bold text-emerald-400/70 uppercase tracking-wider">Éditions</h2>
              <button onClick={() => setShowNewEdition(!showNewEdition)} className="text-xs px-2 py-1 rounded text-amber-400" style={{ background: 'rgba(251,191,36,0.1)' }}>+ Nouvelle</button>
            </div>

            {showNewEdition && (
              <form onSubmit={createEdition} className="space-y-2 mt-3 p-3 rounded-lg" style={{ background: 'rgba(6,78,59,0.3)', border: '1px solid rgba(251,191,36,0.2)' }}>
                <div className="flex gap-1">
                  <button type="button" onClick={() => setNewCategorie('ramadan')} className="flex-1 py-1.5 rounded text-xs font-bold transition-all" style={{ background: newCategorie === 'ramadan' ? 'rgba(251,191,36,0.25)' : 'rgba(2,44,34,0.6)', border: `1px solid ${newCategorie === 'ramadan' ? 'rgba(251,191,36,0.5)' : 'rgba(251,191,36,0.2)'}`, color: newCategorie === 'ramadan' ? '#fbbf24' : '#6ee7b7' }}>
                    🌙 Ramadan
                  </button>
                  <button type="button" onClick={() => setNewCategorie('magal')} className="flex-1 py-1.5 rounded text-xs font-bold transition-all" style={{ background: newCategorie === 'magal' ? 'rgba(251,191,36,0.25)' : 'rgba(2,44,34,0.6)', border: `1px solid ${newCategorie === 'magal' ? 'rgba(251,191,36,0.5)' : 'rgba(251,191,36,0.2)'}`, color: newCategorie === 'magal' ? '#fbbf24' : '#6ee7b7' }}>
                    ⭐ Magal
                  </button>
                </div>
                <input value={newAnnee} onChange={e => setNewAnnee(e.target.value)} className="w-full px-2 py-1.5 rounded text-white text-xs outline-none" style={{ background: 'rgba(2,44,34,0.6)', border: '1px solid rgba(251,191,36,0.2)' }} placeholder="Année (ex: 2027)" type="number" required />
                <input value={newTitre} onChange={e => setNewTitre(e.target.value)} className="w-full px-2 py-1.5 rounded text-white text-xs outline-none" style={{ background: 'rgba(2,44,34,0.6)', border: '1px solid rgba(251,191,36,0.2)' }} placeholder="Titre (optionnel)" />
                {newCategorie === 'ramadan' && (
                  <>
                    <input value={newDatePremierJour} onChange={e => setNewDatePremierJour(e.target.value)} className="w-full px-2 py-1.5 rounded text-white text-xs outline-none" style={{ background: 'rgba(2,44,34,0.6)', border: '1px solid rgba(251,191,36,0.2)' }} type="date" required />
                    <p className="text-emerald-400/50 text-xs">Date du 1er jour de Ramadan → 30 jours auto</p>
                  </>
                )}
                {newCategorie === 'magal' && (
                  <p className="text-emerald-400/50 text-xs">Les kourels seront ajoutés manuellement</p>
                )}
                {createError && <p className="text-red-400 text-xs">{createError}</p>}
                <button type="submit" disabled={creatingEdition} className="w-full py-1.5 rounded text-xs font-medium text-white" style={{ background: creatingEdition ? 'rgba(5,150,105,0.3)' : 'rgba(5,150,105,0.7)' }}>
                  {creatingEdition ? 'Création...' : 'Créer'}
                </button>
              </form>
            )}

            {/* Ramadan editions */}
            {ramadanEditions.length > 0 && (
              <div className="mt-3">
                <p className="text-xs text-emerald-400/40 uppercase tracking-wider mb-1 px-1">🌙 Ramadan</p>
                <div className="space-y-1">
                  {ramadanEditions.map(ed => <EditionButton key={ed.id} edition={ed} />)}
                </div>
              </div>
            )}

            {/* Magal editions */}
            {magalEditions.length > 0 && (
              <div className="mt-3">
                <p className="text-xs text-emerald-400/40 uppercase tracking-wider mb-1 px-1">⭐ Magal</p>
                <div className="space-y-1">
                  {magalEditions.map(ed => <EditionButton key={ed.id} edition={ed} />)}
                </div>
              </div>
            )}
          </div>

          {/* Jours ou Kourels de l'édition sélectionnée */}
          <div className="p-4 flex-1 overflow-y-auto">
            {selectedEdition && (
              <>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xs font-bold text-emerald-400/70 uppercase tracking-wider">
                    {isRamadan ? `Jours ${selectedEdition.annee}` : `Kourels ${selectedEdition.annee}`}
                  </h2>
                  {isMagal && (
                    <button onClick={() => setShowKourelForm(!showKourelForm)} className="text-xs px-2 py-1 rounded text-amber-400" style={{ background: 'rgba(251,191,36,0.1)' }}>+ Kourel</button>
                  )}
                </div>

                {/* Formulaire kourel */}
                {isMagal && showKourelForm && (
                  <form onSubmit={addKourel} className="space-y-2 mb-3 p-3 rounded-lg" style={{ background: 'rgba(6,78,59,0.3)', border: '1px solid rgba(251,191,36,0.2)' }}>
                    <input value={newKourelNom} onChange={e => setNewKourelNom(e.target.value)} className="w-full px-2 py-1.5 rounded text-white text-xs outline-none" style={{ background: 'rgba(2,44,34,0.6)', border: '1px solid rgba(251,191,36,0.2)' }} placeholder="Nom du kourel *" required />
                    <input value={newKourelNomAr} onChange={e => setNewKourelNomAr(e.target.value)} className="w-full px-2 py-1.5 rounded text-amber-400 text-xs outline-none arabic-text" style={{ background: 'rgba(2,44,34,0.6)', border: '1px solid rgba(251,191,36,0.2)', direction: 'rtl' }} placeholder="الاسم بالعربية (optionnel)" />
                    <div className="flex gap-2">
                      <button type="submit" disabled={addingKourel} className="flex-1 py-1.5 rounded text-xs font-medium text-white" style={{ background: 'rgba(5,150,105,0.6)' }}>
                        {addingKourel ? 'Ajout...' : 'Ajouter'}
                      </button>
                      <button type="button" onClick={() => setShowKourelForm(false)} className="px-3 py-1.5 rounded text-xs text-emerald-400" style={{ background: 'rgba(6,78,59,0.4)' }}>✕</button>
                    </div>
                  </form>
                )}

                {/* Liste jours (Ramadan) */}
                {isRamadan && (
                  <div className="space-y-1">
                    {jours.map(jour => {
                      const isSel = selectedJour?.id === jour.id;
                      return (
                        <button key={jour.id} onClick={() => selectJour(jour)} className="w-full text-left px-3 py-2.5 rounded-lg transition-all text-sm" style={{ background: isSel ? 'rgba(251,191,36,0.15)' : 'transparent', border: isSel ? '1px solid rgba(251,191,36,0.3)' : '1px solid transparent' }}>
                          <div className="font-semibold text-amber-400">Jour {jour.numero}</div>
                          <div className="text-emerald-400/70 text-xs truncate">{jour.titre}</div>
                          <div className="text-emerald-400/40 text-xs">{jour.sonsCount ?? 0} piste{(jour.sonsCount ?? 0) > 1 ? 's' : ''}</div>
                        </button>
                      );
                    })}
                    {jours.length === 0 && <p className="text-xs text-emerald-400/40 text-center py-4">Aucun jour</p>}
                  </div>
                )}

                {/* Liste kourels (Magal) */}
                {isMagal && (
                  <div className="space-y-1">
                    {kourels.map(kourel => {
                      const isSel = selectedKourel?.id === kourel.id;
                      return (
                        <div key={kourel.id} className="flex items-center gap-1">
                          <button onClick={() => selectKourel(kourel)} className="flex-1 text-left px-3 py-2.5 rounded-lg transition-all text-sm" style={{ background: isSel ? 'rgba(251,191,36,0.15)' : 'transparent', border: isSel ? '1px solid rgba(251,191,36,0.3)' : '1px solid transparent' }}>
                            <div className="font-semibold text-amber-400">#{kourel.ordre} {kourel.nom}</div>
                            {kourel.nom_ar && <div className="text-amber-400/50 text-xs arabic-text truncate">{kourel.nom_ar}</div>}
                            <div className="text-emerald-400/40 text-xs">{kourel.sonsCount ?? 0} piste{(kourel.sonsCount ?? 0) > 1 ? 's' : ''}</div>
                          </button>
                          <button onClick={() => deleteKourel(kourel.id)} className="p-1.5 rounded text-red-400/50 hover:text-red-400 flex-shrink-0" style={{ background: 'rgba(239,68,68,0.05)' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                          </button>
                        </div>
                      );
                    })}
                    {kourels.length === 0 && (
                      <p className="text-xs text-emerald-400/40 text-center py-4">Aucun kourel — clique sur "+ Kourel" pour commencer</p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!selectedEdition ? (
            <div className="flex items-center justify-center h-full text-center text-emerald-400/50">
              <p className="text-lg">← Sélectionne une édition</p>
            </div>
          ) : !selectedItem ? (
            <div className="flex items-center justify-center h-full text-center text-emerald-400/50">
              <p className="text-lg">← Sélectionne {isRamadan ? 'un jour' : 'un kourel'} pour gérer ses sons</p>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-6">
              {/* Header */}
              <div className="rounded-2xl p-6" style={{ background: 'rgba(6,78,59,0.4)', border: '1px solid rgba(251,191,36,0.2)' }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    {editingTitre ? (
                      <div className="space-y-3">
                        <input value={editTitre} onChange={e => setEditTitre(e.target.value)} className="w-full px-3 py-2 rounded-lg text-white outline-none text-sm" style={{ background: 'rgba(2,44,34,0.6)', border: '1px solid rgba(251,191,36,0.3)' }} placeholder="Titre" />
                        <input value={editTitreAr} onChange={e => setEditTitreAr(e.target.value)} className="w-full px-3 py-2 rounded-lg text-amber-400 outline-none text-sm arabic-text" style={{ background: 'rgba(2,44,34,0.6)', border: '1px solid rgba(251,191,36,0.3)', direction: 'rtl' }} placeholder="العنوان بالعربية" />
                        <div className="flex gap-2">
                          <button onClick={saveTitre} className="px-4 py-1.5 rounded-lg text-sm font-medium text-white" style={{ background: 'rgba(5,150,105,0.6)' }}>Sauvegarder</button>
                          <button onClick={() => setEditingTitre(false)} className="px-4 py-1.5 rounded-lg text-sm text-emerald-400" style={{ background: 'rgba(6,78,59,0.4)' }}>Annuler</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="text-xs text-amber-400/70 uppercase tracking-wider mb-1">{selectedItemLabel} — Édition {selectedEdition?.annee} ({selectedEdition?.categorie})</div>
                        <h2 className="text-2xl font-bold text-white">{selectedItemTitre}</h2>
                        {selectedItemTitreAr && <p className="arabic-text text-amber-400 mt-1">{selectedItemTitreAr}</p>}
                      </>
                    )}
                  </div>
                  {!editingTitre && (
                    <button onClick={() => setEditingTitre(true)} className="flex-shrink-0 text-xs px-3 py-1.5 rounded-lg text-amber-400" style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)' }}>Modifier</button>
                  )}
                </div>
              </div>

              {/* Sons */}
              <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(2,44,34,0.4)', border: '1px solid rgba(251,191,36,0.1)' }}>
                <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(251,191,36,0.1)' }}>
                  <h3 className="font-semibold text-white">{sons.length} piste{sons.length > 1 ? 's' : ''}</h3>
                  <button onClick={() => setShowForm(!showForm)} className="text-sm px-4 py-2 rounded-lg font-medium text-white" style={{ background: showForm ? 'rgba(239,68,68,0.2)' : 'linear-gradient(135deg, #059669, #047857)', border: '1px solid rgba(251,191,36,0.3)' }}>
                    {showForm ? '✕ Annuler' : '+ Ajouter un son'}
                  </button>
                </div>

                {showForm && (
                  <form onSubmit={handleUpload} className="p-6 space-y-4" style={{ borderBottom: '1px solid rgba(251,191,36,0.1)', background: 'rgba(6,78,59,0.2)' }}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-emerald-300 text-xs mb-1.5">Nom du son *</label>
                        <input value={formNom} onChange={e => setFormNom(e.target.value)} className="w-full px-3 py-2 rounded-lg text-white outline-none text-sm" style={{ background: 'rgba(2,44,34,0.6)', border: '1px solid rgba(251,191,36,0.2)' }} placeholder="ex: Yakhyra Dayfi" required />
                      </div>
                      <div>
                        <label className="block text-emerald-300 text-xs mb-1.5">Type</label>
                        <select value={formType} onChange={e => setFormType(e.target.value)} className="w-full px-3 py-2 rounded-lg text-white outline-none text-sm" style={{ background: 'rgba(2,44,34,0.8)', border: '1px solid rgba(251,191,36,0.2)' }}>
                          <option>Kourel</option><option>Khassida</option><option>Awrade</option><option>Conférence</option><option>Zikr</option><option>Audio</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-emerald-300 text-xs mb-1.5">Fichier audio *</label>
                      <input type="file" accept="audio/*,.mp3,.m4a,.ogg,.wav" onChange={e => setFormFile(e.target.files?.[0] || null)} className="w-full text-sm text-emerald-300 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:text-white file:bg-emerald-700 hover:file:bg-emerald-600" required />
                    </div>
                    {formError && <p className="text-red-400 text-sm">{formError}</p>}
                    {uploadProgress && (
                      <div className="space-y-1">
                        <p className="text-emerald-400 text-sm">{uploadProgress}</p>
                        {uploading && (
                          <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(6,78,59,0.5)' }}>
                            <div className="h-full rounded-full" style={{ background: 'linear-gradient(to right, #059669, #fbbf24)', width: uploadProgress.includes('%') ? (uploadProgress.match(/(\d+)%/)?.[1] + '%') : '100%', transition: 'width 0.3s ease' }} />
                          </div>
                        )}
                      </div>
                    )}
                    <button type="submit" disabled={uploading} className="w-full py-2.5 rounded-lg font-semibold text-white text-sm" style={{ background: uploading ? 'rgba(5,150,105,0.4)' : 'linear-gradient(135deg, #059669, #047857)' }}>
                      {uploading ? 'Upload en cours...' : 'Uploader et ajouter'}
                    </button>
                  </form>
                )}

                {loadingSons ? (
                  <div className="p-8 text-center text-emerald-400/50 text-sm">Chargement...</div>
                ) : sons.length === 0 ? (
                  <div className="p-8 text-center text-emerald-400/40 text-sm">Aucun son. Clique sur "+ Ajouter un son" !</div>
                ) : (
                  <div className="divide-y divide-amber-400/10">
                    {sons.map(son => (
                      <div key={son.id} className="px-6 py-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold text-amber-400" style={{ background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.2)' }}>{String(son.ordre).padStart(2, '0')}</div>
                          <div className="min-w-0">
                            <div className="text-white text-sm font-medium truncate">{son.nom}</div>
                            <div className="text-emerald-400/60 text-xs">{son.type} • {son.duree}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button onClick={() => togglePlay(son)} className="text-xs px-2 py-1 rounded" style={{ background: 'rgba(6,78,59,0.5)', color: playingSonId === son.id ? '#fbbf24' : '#34d399' }}>
                            {playingSonId === son.id ? 'Pause' : 'Écouter'}
                          </button>
                          <button onClick={() => deleteSon(son.id)} className="text-xs px-2 py-1 rounded text-red-400" style={{ background: 'rgba(239,68,68,0.1)' }}>Supprimer</button>
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