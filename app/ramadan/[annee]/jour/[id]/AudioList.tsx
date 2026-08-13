'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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

const COUNTDOWN = 5;

export default function AudioList({
  sons,
  jourTitre,
  jourNumero,
  annee,
  totalJours = 30,
}: {
  sons: Son[];
  jourTitre: string;
  jourNumero: number;
  annee: number;
  totalJours?: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [playingId, setPlayingId] = useState<number | null>(null);
  const [pausedId, setPausedId] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const audiosRef = useRef<Record<number, HTMLAudioElement>>({});
  const bannerShownForRef = useRef<number | null>(null);

  const [nextBanner, setNextBanner] = useState<{
    visible: boolean;
    label: string;
    countdown: number;
    type: 'son' | 'jour';
    targetSonId?: number;
    targetJour?: number;
  } | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  const playSon = useCallback((son: Son) => {
    const audio = audiosRef.current[son.id];
    if (!audio) return;
    Object.entries(audiosRef.current).forEach(([id, a]) => {
      if (Number(id) !== son.id) { a.pause(); a.currentTime = 0; }
    });
    setCurrentTime(audio.currentTime);
    setDuration(audio.duration || 0);
    audio.play().catch(console.error);
    setPlayingId(son.id);
    setPausedId(null);
    if (!audio.duration) {
      audio.addEventListener('loadedmetadata', () => setDuration(audio.duration), { once: true });
    }
  }, []);

  const dismissBanner = useCallback(() => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    setNextBanner(null);
  }, []);

  const goNextNow = useCallback((banner: NonNullable<typeof nextBanner>) => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    setNextBanner(null);
    if (banner.type === 'son' && banner.targetSonId !== undefined) {
      const nextSon = sons.find(s => s.id === banner.targetSonId);
      if (nextSon) playSon(nextSon);
    } else if (banner.type === 'jour' && banner.targetJour !== undefined) {
      Object.values(audiosRef.current).forEach(a => { a.pause(); a.currentTime = 0; });
      setPlayingId(null); setPausedId(null);
      router.push(`/ramadan/${annee}/jour/${banner.targetJour}?autoplay=1`);
    }
  }, [sons, playSon, router, annee]);

  const showNextBanner = useCallback((
    type: 'son' | 'jour',
    targetSonId?: number,
    targetJour?: number,
    label?: string
  ) => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    let count = COUNTDOWN;
    const banner = { visible: true, label: label || '', countdown: count, type, targetSonId, targetJour };
    setNextBanner(banner);

    countdownRef.current = setInterval(() => {
      count--;
      setNextBanner(prev => prev ? { ...prev, countdown: count } : null);
      if (count <= 0) {
        clearInterval(countdownRef.current!);
        setNextBanner(null);
        if (type === 'son' && targetSonId !== undefined) {
          const nextSon = sons.find(s => s.id === targetSonId);
          if (nextSon) playSon(nextSon);
        } else if (type === 'jour' && targetJour !== undefined) {
          Object.values(audiosRef.current).forEach(a => { a.pause(); a.currentTime = 0; });
          setPlayingId(null); setPausedId(null);
          router.push(`/ramadan/${annee}/jour/${targetJour}?autoplay=1`);
        }
      }
    }, 1000);
  }, [sons, playSon, router, annee]);

  // Init audios
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

        if (audio.duration && audio.currentTime > 0) {
          const remaining = audio.duration - audio.currentTime;
          if (remaining <= COUNTDOWN && remaining > 0 && bannerShownForRef.current !== son.id) {
            bannerShownForRef.current = son.id;
            const currentIndex = sons.findIndex(s => s.id === son.id);
            const nextSon = sons[currentIndex + 1];
            if (nextSon) {
              showNextBanner('son', nextSon.id, undefined, nextSon.nom);
            } else if (jourNumero < totalJours) {
              showNextBanner('jour', undefined, jourNumero + 1, `Jour ${jourNumero + 1}`);
            }
          }
        }
      });

      audio.addEventListener('loadedmetadata', () => setDuration(audio.duration));
      audiosRef.current[son.id] = audio;
    });

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
      Object.values(audiosRef.current).forEach(a => { a.pause(); a.src = ''; });
    };
  }, [sons]);

  // Autoplay si on arrive depuis le jour précédent
  useEffect(() => {
    if (searchParams.get('autoplay') === '1' && sons.length > 0) {
      setTimeout(() => playSon(sons[0]), 600);
    }
  }, [searchParams, sons]);

  function stopAll() {
    const id = playingId ?? pausedId;
    if (id !== null) {
      const audio = audiosRef.current[id];
      if (audio) { audio.pause(); audio.currentTime = 0; }
    }
    setPlayingId(null); setPausedId(null);
    setCurrentTime(0); setDuration(0);
    dismissBanner();
  }

  function togglePlay(son: Son) {
    const audio = audiosRef.current[son.id];
    if (!audio) return;
    if (playingId === son.id) {
      audio.pause();
      setPlayingId(null);
      setPausedId(son.id);
      dismissBanner();
    } else if (pausedId === son.id) {
      audio.play().catch(console.error);
      setPlayingId(son.id);
      setPausedId(null);
    } else {
      bannerShownForRef.current = null;
      playSon(son);
      dismissBanner();
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
  const playingTitle = activeId !== null ? sons.find(s => s.id === activeId)?.nom : null;
  const showPlayer = activeId !== null;
  const countdownPct = nextBanner ? (nextBanner.countdown / COUNTDOWN) * 100 : 0;

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

        {/* Global player */}
        {showPlayer && (
          <div className="px-4 py-3 md:px-6 md:py-4" style={{ borderBottom: '1px solid rgba(251,191,36,0.1)', background: 'rgba(2,11,8,0.6)' }}>
            <div className="flex items-center gap-4">
              <button
                onClick={() => togglePlay(sons.find(s => s.id === activeId)!)}
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
                    onChange={e => handleSeek(Number(e.target.value))}
                    className="flex-1 h-1 rounded-lg cursor-pointer accent-amber-400"
                    style={{ background: 'rgba(6,78,59,0.6)' }}
                  />
                  <span className="text-xs text-emerald-300/80">{formatTime(duration)}</span>
                </div>
              </div>
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

        {/* Audio rows */}
        <div className="divide-y divide-amber-400/20">
          {sons.length === 0 ? (
            <div className="p-8 text-center text-emerald-300/60">Aucune piste audio disponible pour ce jour.</div>
          ) : (
            sons.map(son => {
              const isPlaying = playingId === son.id;
              const isActive = activeId === son.id;
              return (
                <div
                  key={son.id}
                  className={`audio-row p-5 md:p-6 flex items-center justify-between group cursor-pointer${isActive ? ' playing' : ''}`}
                  onClick={() => togglePlay(son)}
                >
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
                  <div className="btn-group flex items-center space-x-3" onClick={e => e.stopPropagation()}>
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

      {/* Bannière "suivant" style Netflix */}
      {nextBanner?.visible && (
        <div className="fixed bottom-6 right-6 z-50" style={{ animation: 'slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}>
          <div
            className="relative overflow-hidden rounded-2xl px-5 py-4"
            style={{
              background: 'rgba(2, 20, 14, 0.92)',
              border: '1px solid rgba(251,191,36,0.3)',
              backdropFilter: 'blur(16px)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(251,191,36,0.1)',
              minWidth: '260px',
              maxWidth: '320px',
            }}
          >
            {/* Barre countdown */}
            <div
              className="absolute bottom-0 left-0 h-0.5 rounded-full"
              style={{
                width: `${countdownPct}%`,
                background: 'linear-gradient(to right, #059669, #f59e0b)',
                transition: 'width 1s linear',
              }}
            />

            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-emerald-400/70 text-xs uppercase tracking-wider mb-1">
                  {nextBanner.type === 'son' ? 'Son suivant' : 'Jour suivant'} dans {nextBanner.countdown}s
                </p>
                <p className="text-white font-semibold text-sm truncate">{nextBanner.label}</p>
              </div>
              <button
                onClick={dismissBanner}
                className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-emerald-400/50 hover:text-white transition-colors mt-0.5"
                style={{ background: 'rgba(255,255,255,0.05)' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <button
              onClick={() => goNextNow(nextBanner)}
              className="mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold text-white transition-all"
              style={{
                background: 'linear-gradient(135deg, rgba(5,150,105,0.6), rgba(245,158,11,0.3))',
                border: '1px solid rgba(251,191,36,0.2)',
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5,3 19,12 5,21" />
              </svg>
              Lire maintenant
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(40px) scale(0.95); }
          to   { opacity: 1; transform: translateX(0) scale(1); }
        }
      `}</style>
    </>
  );
}
