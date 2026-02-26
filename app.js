// Initialisation globale selon la page
document.addEventListener('DOMContentLoaded', () => {
  const filename = window.location.pathname.split('/').pop() || 'index.html';

  if (filename === '' || filename === 'index.html') {
    initIndexPage();
  } else if (filename === 'jour.html') {
    initJourPage();
  } else if (filename === 'jour1.html') {
    initJour1Page();
  }
});

// Chargement du catalogue depuis data.json
async function loadCatalogue() {
  try {
    const response = await fetch('data.json');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Erreur lors du chargement de data.json :', error);
    return { jours: [] };
  }
}

// =========================
// Page d'accueil (index)
// =========================

function initIndexPage() {
  // Configuration des jours avec titres spécifiques
  const dayTitles = [
    'Kourel Mashrabuç Çâfî',
    'Kourel Nurud Darayni Touba',
    'Kourel Mafatihul Bichri Touba',
    "Kourel Nurud Darayni Parcelles",
    'Kourel Serigne Mahib Gueye',
    'Kourel Nurud Darayni Thies',
    'Kourel Nurud Darayni Keur Massar',
    'Kourel Serigne Saliou Mbacke',
    'Kourel ',
    'Kourel ',
    'Kourel ',
    'Kourel ',
    'Kourel ',
    'Kourel ',
    "Kourel ",
    'Kourel ',
    'Kourel ',
    'Kourel ',
    'Kourel ',
    'Kourel ',
    "Kourel '",
    'Kourel ',
    'Kourel ',
    'Kourel ',
    'Kourel ',
    'Kourel ',
    'Kourel ',
    'Kourel ',
    'Kourel ',
    'Kourel '
  ];

  const grid = document.getElementById('daysGrid');
  if (!grid) return;

  for (let i = 1; i <= 30; i++) {
    const card = document.createElement('a');
    card.href = `jour1.html?day=${i}`;
    card.className =
      'day-card group block rounded-2xl p-6 cursor-pointer relative overflow-hidden';

    card.innerHTML = `
      <div class="absolute inset-0 bg-gradient-to-br from-amber-500/0 to-emerald-500/0 group-hover:from-amber-500/10 group-hover:to-emerald-500/10 transition-all duration-300"></div>
      <div class="relative z-10">
          <div class="flex items-center justify-between mb-3">
              <span class="text-3xl font-bold text-amber-400 group-hover:text-amber-300 transition-colors">Jour ${i}</span>
              <div class="w-10 h-10 rounded-full bg-emerald-800/50 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors border border-amber-400/30">
                  <i data-lucide="chevron-right" class="w-5 h-5 text-amber-400"></i>
              </div>
          </div>
          <h3 class="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-1">Programme</h3>
          <p class="text-white font-medium leading-snug text-emerald-100">${dayTitles[i - 1]}</p>
          <div class="mt-4 flex items-center text-xs text-emerald-400/70">
              <i data-lucide="headphones" class="w-3 h-3 mr-1"></i>
              <span>5 pistes audio</span>
          </div>
      </div>
    `;

    grid.appendChild(card);
  }

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// =========================
// Pages "jour" (liste audio)
// =========================

function getDayNumberFromLocation() {
  const urlParams = new URLSearchParams(window.location.search);
  const dayParam = urlParams.get('day');
  if (dayParam) return parseInt(dayParam, 10);

  const filename = window.location.pathname.split('/').pop();
  const match = filename && filename.match(/jour(\d+)\.html/);
  if (match) return parseInt(match[1], 10);

  return 1;
}

// -------- jour.html (version claire) --------

const jourPageState = {
  currentlyPlaying: null
};

async function initJourPage() {
  const dayNumber = getDayNumberFromLocation();
  const catalogue = await loadCatalogue();
  const dayData =
    (catalogue.jours || []).find((j) => j.jour === dayNumber) || null;

  const tracks =
    dayData && Array.isArray(dayData.sons) && dayData.sons.length
      ? dayData.sons.map((son, index) => ({
          id: son.id != null ? son.id : index + 1,
          title: son.nom || `Son ${index + 1}`,
          duration: son.duree || '--:--',
          url: son.url
        }))
      : [];

  const audioList = document.getElementById('audioList');
  const trackCount = document.getElementById('trackCount');
  if (!audioList) return;

  audioList.innerHTML = '';

  if (tracks.length === 0) {
    audioList.innerHTML =
      '<div class="p-6 text-center text-gray-500">Aucune piste audio disponible pour ce jour.</div>';
  } else {
    tracks.forEach((track) => {
      const row = document.createElement('div');
      row.id = `track-${track.id}`;
      row.className =
        'audio-row p-4 md:p-6 flex items-center justify-between group cursor-pointer';
      row.innerHTML = `
      <div class="flex items-center flex-1 min-w-0 mr-4" onclick="jourPageTogglePlay(${track.id})">
          <div class="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mr-4 flex-shrink-0 group-hover:bg-emerald-100 transition-colors">
              <span class="text-lg font-bold text-emerald-700">${String(
                track.id
              ).padStart(2, '0')}</span>
          </div>
          <div class="min-w-0">
              <h4 class="font-semibold text-gray-900 truncate group-hover:text-emerald-700 transition-colors">${track.title}</h4>
              <div class="flex items-center text-sm text-gray-500 mt-1">
                  <i data-lucide="clock" class="w-3 h-3 mr-1"></i>
                  <span>${track.duration}</span>
                  <span class="mx-2">•</span>
                  <span class="text-emerald-600">MP3</span>
              </div>
          </div>
      </div>
      <audio id="audio-${track.id}" preload="none">
          <source src="${track.url}" type="audio/mpeg">
      </audio>
      <div class="flex items-center space-x-2">
          <button id="play-btn-${track.id}"
                  onclick="event.stopPropagation(); jourPageTogglePlay(${track.id})"
                  class="btn-icon w-12 h-12 rounded-full bg-emerald-100 hover:bg-emerald-200 flex items-center justify-center text-emerald-700 shadow-sm"
                  title="Lecture">
              <i data-lucide="play" class="w-5 h-5 ml-0.5"></i>
          </button>
          <button id="download-btn-${track.id}"
                  onclick="event.stopPropagation(); jourPageDownloadTrack(${track.id}, '${(
                    track.title || ''
                  ).replace(/'/g, "\\'")}')"
                  class="btn-icon w-12 h-12 rounded-full bg-amber-50 hover:bg-amber-100 flex items-center justify-center text-amber-700 shadow-sm"
                  title="Télécharger">
              <i data-lucide="download" class="w-5 h-5"></i>
          </button>
      </div>
    `;
      audioList.appendChild(row);

      const audio = document.getElementById(`audio-${track.id}`);
      if (audio) {
        audio.addEventListener('ended', () => {
          if (jourPageState.currentlyPlaying === track.id) {
            jourPageStopAllAudio();
          }
        });
      }
    });
  }

  if (trackCount) {
    trackCount.textContent = `${tracks.length} piste${tracks.length > 1 ? 's' : ''}`;
  }

  if (dayData) {
    const dayTitle = document.getElementById('dayTitle');
    const daySubtitle = document.getElementById('daySubtitle');
    const dayNumberEl = document.getElementById('dayNumber');
    if (dayTitle) dayTitle.textContent = `Jour ${dayData.jour}`;
    if (daySubtitle && dayData.titre) {
      daySubtitle.textContent = dayData.titre;
    }
    if (dayNumberEl) {
      dayNumberEl.textContent = dayData.jour.toString().padStart(2, '0');
    }
  }

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function jourPageTogglePlay(trackId) {
  const row = document.getElementById(`track-${trackId}`);
  const btn = document.getElementById(`play-btn-${trackId}`);
  const icon = btn ? btn.querySelector('i') : null;
  const audio = document.getElementById(`audio-${trackId}`);

  if (!audio || !row || !btn || !icon) return;

  if (jourPageState.currentlyPlaying && jourPageState.currentlyPlaying !== trackId) {
    jourPageStopAllAudio();
  }

  if (jourPageState.currentlyPlaying === trackId) {
    audio.pause();
    jourPageState.currentlyPlaying = null;
    row.classList.remove('playing');
    icon.setAttribute('data-lucide', 'play');
    jourPageHideMobilePlayer();
  } else {
    audio.play().catch((e) => {
      console.log('Audio play error:', e);
    });
    jourPageState.currentlyPlaying = trackId;
    row.classList.add('playing');
    icon.setAttribute('data-lucide', 'pause');

    const titleEl = row.querySelector('h4');
    jourPageShowMobilePlayer(titleEl ? titleEl.textContent : 'Lecture en cours...');
  }

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function jourPageStopAllAudio() {
  if (!jourPageState.currentlyPlaying) return;

  const currentId = jourPageState.currentlyPlaying;
  const audio = document.getElementById(`audio-${currentId}`);
  const row = document.getElementById(`track-${currentId}`);
  const btn = document.getElementById(`play-btn-${currentId}`);
  const icon = btn ? btn.querySelector('i') : null;

  if (audio) audio.pause();
  if (row) row.classList.remove('playing');
  if (icon) icon.setAttribute('data-lucide', 'play');

  jourPageState.currentlyPlaying = null;
  jourPageHideMobilePlayer();

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function jourPageDownloadTrack(trackId, title) {
  const audio = document.getElementById(`audio-${trackId}`);
  if (!audio) return;

  const source = audio.querySelector ? audio.querySelector('source') : null;
  const url = (source && source.src) || audio.src;
  if (!url) return;

  const a = document.createElement('a');
  a.href = url;
  a.download = `Jour${getDayNumberFromLocation()}_Son${trackId}_${title.replace(
    /\s+/g,
    '_'
  )}.mp3`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  const btn = document.getElementById(`download-btn-${trackId}`);
  if (!btn) return;

  const originalContent = btn.innerHTML;
  btn.innerHTML =
    '<i data-lucide="check" class="w-5 h-5 text-emerald-600"></i>';
  if (window.lucide) {
    window.lucide.createIcons();
  }
  setTimeout(() => {
    btn.innerHTML = originalContent;
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }, 2000);
}

function jourPageShowMobilePlayer(title) {
  const bar = document.getElementById('playerBar');
  const titleEl = document.getElementById('mobileTrackTitle');
  if (!bar || !titleEl) return;
  titleEl.textContent = title;
  bar.classList.remove('translate-y-full');
}

function jourPageHideMobilePlayer() {
  const bar = document.getElementById('playerBar');
  if (!bar) return;
  bar.classList.add('translate-y-full');
}

// -------- jour1.html (version sombre) --------

const jour1PageState = {
  currentlyPlaying: null,
  audioElements: {}
};

async function initJour1Page() {
  const dayNumber = getDayNumberFromLocation();
  const catalogue = await loadCatalogue();
  const dayData =
    (catalogue.jours || []).find((j) => j.jour === dayNumber) || null;

  const tracks =
    dayData && Array.isArray(dayData.sons) && dayData.sons.length
      ? dayData.sons.map((son, index) => ({
          id: son.id != null ? son.id : index + 1,
          title: son.nom || `Son ${index + 1}`,
          duration: son.duree || '--:--',
          type: son.type || 'Audio',
          url: son.url
        }))
      : [];

  const audioList = document.getElementById('audioList');
  const trackCount = document.getElementById('trackCount');
  if (!audioList) return;

  audioList.innerHTML = '';

  if (tracks.length === 0) {
    audioList.innerHTML =
      '<div class="p-6 text-center text-emerald-300/80">Aucune piste audio disponible pour ce jour.</div>';
  } else {
    tracks.forEach((track) => {
      const row = document.createElement('div');
      row.id = `track-${track.id}`;
      row.className =
        'audio-row p-5 md:p-6 flex items-center justify-between group';
      row.innerHTML = `
      <div class="flex items-center flex-1 min-w-0 mr-4 cursor-pointer" onclick="jour1TogglePlay(${track.id})">
          <div class="number-badge w-14 h-14 rounded-xl flex items-center justify-center mr-4 flex-shrink-0">
              <span class="text-xl font-bold text-amber-400">${String(
                track.id
              ).padStart(2, '0')}</span>
          </div>
          <div class="min-w-0 flex-1">
              <h4 class="font-semibold text-white text-lg truncate group-hover:text-amber-400 transition-colors">${track.title}</h4>
              <div class="flex items-center text-sm text-emerald-400/70 mt-1 space-x-3">
                  <span class="flex items-center">
                      <i data-lucide="clock" class="w-3 h-3 mr-1"></i>
                      ${track.duration}
                  </span>
                  <span class="w-1 h-1 rounded-full bg-emerald-400/50"></span>
                  <span class="text-amber-400/80 text-xs uppercase tracking-wider border border-amber-400/30 px-2 py-0.5 rounded">${track.type}</span>
                  <span class="w-1 h-1 rounded-full bg-emerald-400/50"></span>
                  <span class="text-emerald-300">MP3</span>
              </div>
          </div>
      </div>
      <div class="flex items-center space-x-3">
          <button id="play-btn-${track.id}"
                  onclick="event.stopPropagation(); jour1TogglePlay(${track.id})"
                  class="btn-icon btn-play w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg"
                  title="Écouter">
              <i data-lucide="play" class="w-5 h-5 ml-0.5"></i>
          </button>
          <button id="download-btn-${track.id}"
                  onclick="event.stopPropagation(); jour1DownloadTrack(${track.id}, '${(
                    track.title || ''
                  ).replace(/'/g, "\\'")}')"
                  class="btn-icon btn-download w-12 h-12 rounded-xl flex items-center justify-center text-amber-400"
                  title="Télécharger">
              <i data-lucide="download" class="w-5 h-5"></i>
          </button>
      </div>
    `;
      audioList.appendChild(row);

      jour1InitAudioPlayer(track);
    });
  }

  if (trackCount) {
    trackCount.textContent = `${tracks.length} piste${tracks.length > 1 ? 's' : ''}`;
  }

  // Mise à jour de l'en-tête (jour, kourel, date) pour jour1.html
  const totalDays = 30;
  const badgeEl = document.getElementById('dayBadge');
  if (badgeEl) {
    badgeEl.textContent = `Jour ${dayNumber} sur ${totalDays}`;
  }

  const titleHeaderEl = document.getElementById('dayKourelTitle');
  if (titleHeaderEl) {
    if (dayData && dayData.titre) {
      titleHeaderEl.textContent = dayData.titre;
    } else {
      titleHeaderEl.textContent = `Kourel jour ${dayNumber}`;
    }
  }

  const dateNumberEl = document.getElementById('dayDateNumber');
  const dateMonthEl = document.getElementById('dayDateMonth');
  if (dateNumberEl && dateMonthEl) {
    // Jour 1 = 19 février 2026, puis on ajoute (jour - 1) jours
    const baseDate = new Date(2026, 1, 19); // mois 1 = février
    const currentDate = new Date(
      baseDate.getTime() + (dayNumber - 1) * 24 * 60 * 60 * 1000
    );

    const dayOfMonth = currentDate.getDate();
    const monthsFr = [
      'Janvier',
      'Fevrier',
      'Mars',
      'Avril',
      'Mai',
      'Juin',
      'Juillet',
      'Août',
      'Septembre',
      'Octobre',
      'Novembre',
      'Decembre'
    ];
    const monthName = monthsFr[currentDate.getMonth()];

    dateNumberEl.textContent = dayOfMonth.toString().padStart(2, '0');
    dateMonthEl.textContent = monthName;
  }

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function jour1InitAudioPlayer(track) {
  const audio = new Audio();
  audio.crossOrigin = "anonymous";  // ← fix CORS Cloudinary
  audio.preload = 'none';
  audio.src = track.url;
  jour1PageState.audioElements[track.id] = audio;

  audio.addEventListener('ended', () => {
    if (jour1PageState.currentlyPlaying === track.id) {
      jour1StopAllAudio();
    }
  });
}

function jour1TogglePlay(trackId) {
  const row = document.getElementById(`track-${trackId}`);
  const btn = document.getElementById(`play-btn-${trackId}`);
  const audio = jour1PageState.audioElements[trackId];

  if (!audio || !row || !btn) return;

  if (
    jour1PageState.currentlyPlaying &&
    jour1PageState.currentlyPlaying !== trackId
  ) {
    jour1StopAllAudio();
  }

  if (jour1PageState.currentlyPlaying === trackId) {
    audio.pause();
    jour1PageState.currentlyPlaying = null;
    row.classList.remove('playing');
    btn.innerHTML = '<i data-lucide="play" class="w-5 h-5 ml-0.5"></i>';
    jour1HideMobilePlayer();
  } else {
    audio.play().catch((e) => {
      console.log('Lecture audio :', e);
    });
    jour1PageState.currentlyPlaying = trackId;
    row.classList.add('playing');
    btn.innerHTML = '<i data-lucide="pause" class="w-5 h-5"></i>';

    const titleEl = row.querySelector('h4');
    jour1ShowMobilePlayer(titleEl ? titleEl.textContent : 'Lecture en cours...');
  }

  if (window.lucide) {
    window.lucide.createIcons();
  }
}
function jour1StopAllAudio() {
  if (!jour1PageState.currentlyPlaying) return;

  const currentId = jour1PageState.currentlyPlaying;
  const audio = jour1PageState.audioElements[currentId];
  const row = document.getElementById(`track-${currentId}`);
  const btn = document.getElementById(`play-btn-${currentId}`);
  const icon = btn ? btn.querySelector('i') : null;

  if (audio) audio.pause();
  if (row) row.classList.remove('playing');
  if (icon) icon.setAttribute('data-lucide', 'play');

  jour1PageState.currentlyPlaying = null;
  jour1HideMobilePlayer();

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function jour1DownloadTrack(trackId, title) {
  const audio = jour1PageState.audioElements[trackId];
  if (!audio || !audio.src) return;

  const url = audio.src;
  const a = document.createElement('a');
  a.href = url;
  a.download = `Jour${getDayNumberFromLocation()}_Son${trackId}_${title.replace(
    /\s+/g,
    '_'
  )}.mp3`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  const btn = document.getElementById(`download-btn-${trackId}`);
  if (!btn) return;

  const originalHTML = btn.innerHTML;
  btn.innerHTML =
    '<i data-lucide="check" class="w-5 h-5 text-emerald-400"></i>';
  btn.classList.add('bg-emerald-500/30');
  if (window.lucide) {
    window.lucide.createIcons();
  }

  setTimeout(() => {
    btn.innerHTML = originalHTML;
    btn.classList.remove('bg-emerald-500/30');
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }, 2000);
}

function jour1ShowMobilePlayer(title) {
  const bar = document.getElementById('playerBar');
  const titleEl = document.getElementById('mobileTrackTitle');
  if (!bar || !titleEl) return;
  titleEl.textContent = title;
  bar.classList.remove('translate-y-full');
}

function jour1HideMobilePlayer() {
  const bar = document.getElementById('playerBar');
  if (!bar) return;
  bar.classList.add('translate-y-full');
}

