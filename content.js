let lastSpeed = 1.0;
let recorder = null;
let chunks = [];

// ====================== VELOCIDADE ======================
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

// ====================== DOWNLOAD DIRETO ======================
function downloadDirect(isAudioOnly) {
  const media = document.querySelector('video') || document.querySelector('audio');
  if (!media) return { success: false, message: "Nenhum player encontrado" };

  const src = media.currentSrc || media.src;
  if (src && src.length > 15) {
    const a = document.createElement('a');
    a.href = src;
    a.download = `media_${Date.now()}.${isAudioOnly ? 'mp3' : 'mp4'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return { success: true, message: `⬇️ Download ${isAudioOnly ? 'Áudio' : 'Vídeo'} iniciado` };
  }
  return { success: false, message: "Link direto nao encontrado" };
}

// ====================== GRAVAR ======================
function startRecording() {
  const media = document.querySelector('video') || document.querySelector('audio');
  if (!media) return { success: false, message: "Nenhum player encontrado" };

  if (recorder) recorder.stop();

  chunks = [];

  try {
    recorder = new MediaRecorder(media.captureStream(), { mimeType: 'video/webm;codecs=vp9,opus' });

    recorder.ondataavailable = e => chunks.push(e.data);

    recorder.onstop = () => {
      if (chunks.length > 0) {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `recording_${Date.now()}.webm`;
        a.click();
        URL.revokeObjectURL(url);
      }
      recorder = null;
    };

    recorder.start(300);

    media.onended = () => setTimeout(() => recorder?.stop(), 1200);

    return { success: true, message: "Gravando... Use 'Parar Gravacao' quando quiser" };

  } catch (e) {
    return { success: false, message: "Nao foi possível iniciar gravacao" };
  }
}

function stopRecording() {
  if (recorder) {
    recorder.stop();
    recorder = null;
    return { success: true, message: "Gravação parada" };
  }
  return { success: false, message: "Nenhuma gravação ativa" };
}

// ====================== LISTENER ======================
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "setSpeed") {
    sendResponse(applySpeed(request.speed));
  } 
  else if (request.action === "downloadDirectVideo") {
    sendResponse(downloadDirect(false));
  } 
  else if (request.action === "downloadDirectAudio") {
    sendResponse(downloadDirect(true));
  } 
  else if (request.action === "downloadRecord") {
    sendResponse(startRecording());
  } 
  else if (request.action === "stopRecording") {
    sendResponse(stopRecording());
  }
});

// Observer de velocidade
const observer = new MutationObserver(() => {
  if (lastSpeed !== 1.0) {
    document.querySelectorAll('video, audio').forEach(m => m.playbackRate = lastSpeed);
  }
});
observer.observe(document.body, { childList: true, subtree: true });

console.log("Video Turbo - Com botão Parar Gravação inteligente");