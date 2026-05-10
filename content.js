let lastSpeed = 1.0;
let currentRecorder = null;
let recordedChunks = [];

// ====================== SPEED ======================
function applySpeedToAllMedia(speed) {
  let count = 0;
  lastSpeed = speed;

  const apply = (media) => {
    if (media) {
      media.playbackRate = speed;
      count++;
    }
  };

  document.querySelectorAll('video, audio').forEach(apply);

  function scanShadows(root) {
    if (!root) return;
    root.querySelectorAll('video, audio').forEach(apply);
    root.querySelectorAll('*').forEach(el => el.shadowRoot && scanShadows(el.shadowRoot));
  }
  scanShadows(document);

  return { success: count > 0, count, speed, message: `${count} mídias → ${speed}x` };
}

// ====================== DOWNLOAD AUTOMÁTICO ======================
function startAutoRecording(isAudioOnly = false) {
  const video = document.querySelector('video');
  if (!video) {
    return { success: false, message: "Nenhum vídeo reproduzindo encontrado" };
  }

  // Para gravação anterior se existir
  if (currentRecorder) currentRecorder.stop();

  recordedChunks = [];

  try {
    const stream = isAudioOnly 
      ? new MediaStream(video.captureStream().getAudioTracks())
      : video.captureStream();

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
      a.download = `video_${Date.now()}.${isAudioOnly ? 'mp3' : 'webm'}`;
      a.click();
      URL.revokeObjectURL(url);

      currentRecorder = null;
    };

    // Inicia gravação
    currentRecorder.start(300);

    // Para automaticamente quando o vídeo terminar
    video.onended = () => {
      if (currentRecorder) {
        setTimeout(() => currentRecorder.stop(), 800); // pequeno delay para pegar o final
      }
    };

    return { 
      success: true, 
      message: isAudioOnly 
        ? "Gravando áudio... (vai baixar ao final do vídeo)" 
        : "Gravando vídeo... (vai baixar automaticamente ao final)" 
    };

  } catch (err) {
    console.error(err);
    return { success: false, message: "Erro ao iniciar gravação" };
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

// Observer para velocidade
const observer = new MutationObserver(() => {
  if (lastSpeed !== 1.0) {
    document.querySelectorAll('video').forEach(v => v.playbackRate = lastSpeed);
  }
});
observer.observe(document.body, { childList: true, subtree: true });

console.log("Video Turbo + Download Automático carregado");