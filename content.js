// content.js - Versão AGRESSIVA para WhatsApp Web
function applySpeedToAllMedia(speed) {
  let count = 0;

  const applyToElement = (media) => {
    if (media && media.playbackRate !== undefined) {
      media.playbackRate = speed;
      
      // Força atualização
      if (!media.paused) {
        media.play().catch(() => {});
      }
      
      // Evento extra
      try {
        media.dispatchEvent(new Event('ratechange'));
      } catch(e) {}
      
      count++;
    }
  };

  // 1. Vídeos e áudios diretos
  document.querySelectorAll('video, audio').forEach(applyToElement);

  // 2. Busca recursiva em Shadow DOMs (WhatsApp usa muito)
  function scanShadowRoots(root) {
    if (!root) return;
    
    root.querySelectorAll('video, audio').forEach(applyToElement);
    
    root.querySelectorAll('*').forEach(el => {
      if (el.shadowRoot) {
        scanShadowRoots(el.shadowRoot);
      }
    });
  }
  
  scanShadowRoots(document);

  // 3. Tenta encontrar players do WhatsApp por classes comuns
  document.querySelectorAll('[data-testid*="video"], [role="video"], video').forEach(applyToElement);

  console.log(`Video Turbo: Aplicada velocidade ${speed}x em ${count} mídias`);
  return { success: count > 0, count: count, speed: speed };
}

// Aplica velocidade sempre que um novo vídeo/áudio começar a tocar
document.addEventListener('play', (e) => {
  if (e.target.tagName === 'VIDEO' || e.target.tagName === 'AUDIO') {
    // Mantém a última velocidade usada
    if (window.lastTurboSpeed) {
      e.target.playbackRate = window.lastTurboSpeed;
    }
  }
}, true);

// Listener da popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "setSpeed") {
    window.lastTurboSpeed = request.speed;   // salva pra novos vídeos
    const result = applySpeedToAllMedia(request.speed);
    sendResponse(result);
  }
});

console.log("✅ Video Turbo (Aggressive Mode) carregado");