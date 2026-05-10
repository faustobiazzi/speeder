let lastSpeed = 1.0;
let recorder = null;
let chunks = [];

// ====================== VELOCIDADE (independente) ======================
function applySpeed(speed) {
  lastSpeed = speed;
  let count = 0;

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

// ====================== GRAVAÇÃO INDEPENDENTE ======================
function startIndependentRecording(isAudioOnly = false) {
  const media = document.querySelector('video') || document.querySelector('audio');
  if (!media) {
    return { success: false, message: "Nenhum player encontrado" };
  }

  // Para gravação anterior
  if (recorder) recorder.stop();

  chunks = [];

  try {
    // Captura o stream original (sempre em 1x, independente da playbackRate)
    const originalStream = media.captureStream();
    
    recorder = new MediaRecorder(originalStream, {
      mimeType: 'video/webm;codecs=vp9,opus'
    });

    recorder.ondataavailable = e => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = () => {
      if (chunks.length === 0) return;
      
      const blob = new Blob(chunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `recording_${Date.now()}.${isAudioOnly ? 'mp3' : 'webm'}`;
      a.click();
      URL.revokeObjectURL(url);
    };

    recorder.start(300);

    // Para automaticamente quando a mídia acabar
    media.onended = () => {
      setTimeout(() => { if (recorder) recorder.stop(); }, 1200);
    };

    return { 
      success: true, 
      message: isAudioOnly 
        ? "Gravando AUDIO em velocidade normal..." 
        : "Gravando VIDEO em velocidade normal..." 
    };

  } catch (err) {
    console.error(err);
    return { success: false, message: "Erro ao iniciar gravacao" };
  }
}

function stopCurrentRecording() {
  if (recorder) {
    recorder.stop();
    recorder = null;
    return { success: true, message: "Gravaçcao parada" };
  }
  return { success: false, message: "Nenhuma gravacao ativa" };
}

// ====================== LISTENER ======================
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "setSpeed") {
    sendResponse(applySpeed(request.speed));
  } 
  else if (request.action === "downloadVideo") {
    sendResponse(startIndependentRecording(false));
  } 
  else if (request.action === "downloadAudio") {
    sendResponse(startIndependentRecording(true));
  } 
  else if (request.action === "stopRecording") {
    sendResponse(stopCurrentRecording());
  }
});

// Observer para manter velocidade
const observer = new MutationObserver(() => {
  if (lastSpeed !== 1.0) {
    document.querySelectorAll('video, audio').forEach(m => {
      if (m.playbackRate !== lastSpeed) m.playbackRate = lastSpeed;
    });
  }
});
observer.observe(document.body, { childList: true, subtree: true });

console.log("Video Turbo");