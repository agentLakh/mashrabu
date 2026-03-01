'use client';

import { useState, useRef, useEffect } from 'react';
import type { Son } from '@/lib/supabase';

const PLAY_SVG = (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="5,3 19,12 5,21" />
  </svg>
);

const PAUSE_SVG = (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" />
  </svg>
);

const DOWNLOAD_SVG = (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

function formatTime(sec: number): string {
  if (!isFinite(sec) || isNaN(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function AudioList({ sons, jourTitre, jourNumero }: { sons: Son[]; jourTitre: string; jourNumero: number }) {
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [pausedId, setPausedId] = useState<number | null>(null); // lecteur visible mais en pause
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const audiosRef = useRef<Record<number, HTMLAudioElement>>({});

  useEffect(() => {
    sons.forEach((son) => {
      const audio = new Audio();
      audio.crossOrigin = 'anonymous';
      audio.preload = 'none';
      audio.src = son.url;
      audio.addEventListener('ended', () => {
        setPlayingId(null);
        setPausedId(null);
      });
      audio.addEventListener('timeupdate', () => {
        if (!isSeeking) setCurrentTime(audio.currentTime);
      });
      audio.addEventListener('loadedmetadata', () => {
        setDuration(audio.duration);
      });
      audiosRef.current[son.id] = audio;
    });
    return () => {
      Object.values(audiosRef.current).forEach((a) => { a.pause(); a.src = ''; });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sons]);

  // Ferme complètement le lecteur (bouton X)
  function stopAll() {
    const id = playingId ?? pausedId;
    if (id !== null) {
      const audio = audiosRef.current[id];
      if (audio) { audio.pause(); audio.currentTime = 0; }
    }
    setPlayingId(null);
    setPausedId(null);
    setCurrentTime(0);
    setDuration(0);
  }

  function togglePlay(son: Son) {
    const audio = audiosRef.current[son.id];
    if (!audio) return;

    if (playingId === son.id) {
      // Met en pause — lecteur reste visible
      audio.pause();
      setPlayingId(null);
      setPausedId(son.id);
    } else if (pausedId === son.id) {
      // Reprend depuis la pause
      audio.play().catch(console.error);
      setPlayingId(son.id);
      setPausedId(null);
    } else {
      // Nouveau son — arrête le précédent
      const prevId = playingId ?? pausedId;
      if (prevId !== null) {
        const prev = audiosRef.current[prevId];
        if (prev) { prev.pause(); prev.currentTime = 0; }
      }
      setCurrentTime(audio.currentTime);
      setDuration(audio.duration || 0);
      audio.play().catch(console.error);
      setPlayingId(son.id);
      setPausedId(null);
      if (!audio.duration) {
        audio.addEventListener('loadedmetadata', () => setDuration(audio.duration), { once: true });
      }
    }
  }

  function handleSeek(val: number) {
    const id = playingId ?? pausedId;
    if (id === null) return;
    const audio = audiosRef.current[id];
    if (audio) audio.currentTime = val;
    setCurrentTime(val);
  }

  const activeId = playingId ?? pausedId;
  const playingTitle = activeId !== null ? sons.find((s) => s.id === activeId)?.nom : null;
  const showPlayer = activeId !== null;

  return (
    <>
      <div className="rounded-3xl overflow-hidden backdrop-blur-sm" style={{ background: 'rgba(2,44,34,0.3)', border: '1px solid rgba(251,191,36,0.1)' }}>
        {/* List header */}
        <div className="list-header p-6 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(251,191,36,0.1)', background: 'linear-gradient(to right, rgba(6,78,59,0.5), transparent)' }}>
          <h3 className="text-xl font-semibold text-white flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m9 9 10.5-3m0 6.553v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 1 1-.99-3.467l2.31-.66a2.25 2.25 0 0 0 1.632-2.163Zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 0 1-.99-3.467l2.31-.66A2.25 2.25 0 0 0 9 15.553Z" />
            </svg>
            Liste des enregistrements
          </h3>
          <span id="trackCount" className="text-sm text-amber-400 px-4 py-2 rounded-full" style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)' }}>
            {sons.length} piste{sons.length > 1 ? 's' : ''}
          </span>
        </div>

        {/* Global player — visible si en lecture OU en pause */}
        {showPlayer && (
          <div className="px-4 py-3 md:px-6 md:py-4" style={{ borderBottom: '1px solid rgba(251,191,36,0.1)', background: 'rgba(2,11,8,0.6)' }}>
            <div className="flex items-center gap-4">
              <button
                onClick={() => togglePlay(sons.find((s) => s.id === activeId)!)}
                className="w-10 h-10 rounded-full flex items-center justify-center text-amber-300"
                style={{ background: 'rgba(245,158,11,0.2)' }}
              >
                {playingId !== null ? PAUSE_SVG : PLAY_SVG}
              </button>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-white truncate">{playingTitle}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-emerald-300/80">{formatTime(currentTime)}</span>
                  <input
                    type="range" min={0} max={Math.floor(duration) || 0} value={Math.floor(currentTime)}
                    onMouseDown={() => setIsSeeking(true)}
                    onMouseUp={() => setIsSeeking(false)}
                    onChange={(e) => handleSeek(Number(e.target.value))}
                    className="flex-1 h-1 rounded-lg cursor-pointer accent-amber-400"
                    style={{ background: 'rgba(6,78,59,0.6)' }}
                  />
                  <span className="text-xs text-emerald-300/80">{formatTime(duration)}</span>
                </div>
              </div>
              {/* X — ferme complètement le lecteur */}
              <button
                onClick={stopAll}
                className="w-9 h-9 rounded-full flex items-center justify-center text-red-300"
                style={{ background: 'rgba(239,68,68,0.2)' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Audio rows — toute la ligne est cliquable */}
        <div className="divide-y divide-amber-400/20">
          {sons.length === 0 ? (
            <div className="p-8 text-center text-emerald-300/60">Aucune piste audio disponible pour ce jour.</div>
          ) : (
            sons.map((son) => {
              const isPlaying = playingId === son.id;
              const isActive = activeId === son.id;
              return (
                <div
                  key={son.id}
                  className={`audio-row p-5 md:p-6 flex items-center justify-between group cursor-pointer${isActive ? ' playing' : ''}`}
                  onClick={() => togglePlay(son)}
                >
                  {/* Left: number + title */}
                  <div className="flex items-center flex-1 min-w-0 mr-4">
                    <div className="number-badge w-10 h-10 rounded-xl flex items-center justify-center mr-3 flex-shrink-0">
                      <span className="text-xl font-bold">{String(son.ordre).padStart(2, '0')}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-semibold text-white text-lg truncate group-hover:text-amber-400 transition-colors">{son.nom}</h4>
                      <div className="audio-meta flex items-center text-sm mt-1 space-x-3" style={{ color: 'rgba(52,211,153,0.7)' }}>
                        <span className="flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                          </svg>
                          {son.duree}
                        </span>
                        <span className="dot w-1 h-1 rounded-full" style={{ background: 'rgba(52,211,153,0.5)' }}></span>
                        <span className="type-badge text-amber-400/80 text-xs uppercase tracking-wider px-2 py-0.5 rounded" style={{ border: '1px solid rgba(251,191,36,0.3)' }}>{son.type}</span>
                        <span className="dot w-1 h-1 rounded-full" style={{ background: 'rgba(52,211,153,0.5)' }}></span>
                        <span className="text-emerald-300">MP3</span>
                        {isPlaying && (
                          <span className="flex items-center gap-0.5 ml-2">
                            <span className="eq-bar"></span>
                            <span className="eq-bar"></span>
                            <span className="eq-bar"></span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Buttons — stoppe la propagation pour éviter double toggle */}
                  <div className="btn-group flex items-center space-x-3" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => togglePlay(son)}
                      className="btn-icon btn-play w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg"
                      title="Écouter"
                    >
                      {isPlaying ? PAUSE_SVG : PLAY_SVG}
                    </button>
                    <a
                      href={son.url.replace('/upload/', '/upload/fl_attachment/')}
                      download={`Jour${jourNumero}_${son.ordre}_${son.nom}.mp3`}
                      className="btn-icon btn-download w-12 h-12 rounded-xl flex items-center justify-center"
                      title="Télécharger"
                    >
                      {DOWNLOAD_SVG}
                    </a>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 text-center text-sm" style={{ background: 'rgba(6,78,59,0.3)', borderTop: '1px solid rgba(251,191,36,0.1)', color: 'rgba(52,211,153,0.5)' }}>
          Cliquez sur lecture pour écouter ou sur le bouton télécharger pour sauvegarder
        </div>
      </div>
    </>
  );
}
