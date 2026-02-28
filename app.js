async function jourPageDownloadTrack(trackId, title) {
  const audio = document.getElementById(`audio-${trackId}`);
  if (!audio) return;

  const source = audio.querySelector ? audio.querySelector('source') : null;
  const url = (source && source.src) || audio.src;
  if (!url) return;

  const btn = document.getElementById(`download-btn-${trackId}`);
  const originalContent = btn ? btn.innerHTML : '';

  try {
    // Changement visuel pour indiquer le début du téléchargement
    if (btn) {
      btn.innerHTML = '<i data-lucide="loader" class="w-5 h-5 animate-spin"></i>';
      if (window.lucide) window.lucide.createIcons();
    }

    // Récupération du fichier en tant que Blob pour forcer le téléchargement
    const response = await fetch(url);
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `Jour${getDayNumberFromLocation()}_Son${trackId}_${title.replace(/\s+/g, '_')}.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(blobUrl);

    // Succès
    if (btn) {
      btn.innerHTML = '<i data-lucide="check" class="w-5 h-5 text-emerald-600"></i>';
      if (window.lucide) window.lucide.createIcons();
    }
  } catch (error) {
    console.error('Erreur lors du téléchargement :', error);
    // En cas d'échec (ex: CORS), on tente la méthode classique
    const a = document.createElement('a');
    a.href = url;
    a.download = `Jour${getDayNumberFromLocation()}_Son${trackId}_${title.replace(/\s+/g, '_')}.mp3`;
    a.target = '_blank';
    a.click();
  }

  // Remise à zéro de l'icône après 2 secondes
  setTimeout(() => {
    if (btn) {
      btn.innerHTML = originalContent;
      if (window.lucide) window.lucide.createIcons();
    }
  }, 2000);
}