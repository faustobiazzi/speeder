let lastSpeed = 1.0;
let currentRecorder = null;
let recordedChunks = [];

// ====================== SPEED ======================
function applySpeedToAllMedia(speed) {
  let count = 0;
  lastSpeed = speed;

  const apply = (media) => {
    if (media && typeof media.playbackRate !== 'undefined') {
      media.playbackRate = speed;
      count++;
    }
  };

  // Seletores gerais
  document.querySelectorAll('video, audio').forEach(apply);

  // YouTube Music específico
  document.querySelectorAll('ytmusic-player video, ytmusic-player audio').forEach(apply);

  // Spotify
  document.querySelectorAll('audio').forEach(apply); // Spotify usa <audio>

  // Shadow DOM
  function scanShadows(root) {
    if (!root) return;
    root.querySelectorAll('video, audio').forEach(apply);
    root.querySelectorAll('*').forEach(el => el.shadowRoot && scanShadows(el.shadowRoot));
  }
  scanShadows(document);

  return { 
    success: count > 0, 
    count, 
    speed, 
    message: `${count} mídias → ${speed}x` 
  };
}

// ====================== DOWNLOAD AUTOMÁTICO ======================
function startAutoRecording(isAudioOnly = false) {
  // Tenta pegar tanto video quanto audio (Spotify usa audio)
  let media = document.querySelector('video') || document.querySelector('audio');

  if (!media) {
    return { success: false, message: "Nenhum player encontrado" };
  }

  if (currentRecorder) currentRecorder.stop();

  recordedChunks = [];

  try {
    const stream = isAudioOnly 
      ? new MediaStream(media.captureStream().getAudioTracks())
      : media.captureStream();

    currentRecorder = new MediaRecorder(stream, { 
      mimeType: 'video/webm;codecs=vp9,opus' 
    });

    currentRecorder.ondataavailable = e => {
      if (e.data.size > 0) recordedChunks.push(e.data);
    };

    currentRecorder.onstop = () => {
      if (recordedChunks.length === 0) return;
      const blob = new Blob(recordedChunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `music_${Date.now()}.${isAudioOnly ? 'mp3' : 'webm'}`;
      a.click();
      URL.revokeObjectURL(url);
    };

    currentRecorder.start(300);

    // Para automaticamente quando a música acabar
    media.onended = () => {
      setTimeout(() => {
        if (currentRecorder) currentRecorder.stop();
      }, 1000);
    };

    return { 
      success: true, 
      message: isAudioOnly 
        ? "Gravando Áudio... (baixa ao final)" 
        : "Gravando... (baixa ao final)" 
    };

  } catch (err) {
    console.error(err);
    return { success: false, message: "Não foi possível iniciar gravação neste player" };
  }
}

// ====================== LISTENER ======================
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "setSpeed") {
    sendResponse(applySpeedToAllMedia(request.speed));
  } 
  else if (request.action === "downloadVideo") {
    sendResponse(startAutoRecording(false));
  } 
  else if (request.action === "downloadAudio") {
    sendResponse(startAutoRecording(true));
  }
});

// Observer + auto speed
const observer = new MutationObserver(() => {
  if (lastSpeed !== 1.0) {
    document.querySelectorAll('video, audio').forEach(m => {
      if (m.playbackRate !== lastSpeed) m.playbackRate = lastSpeed;
    });
  }
});
observer.observe(document.body, { childList: true, subtree: true });

console.log("Video Turbo");