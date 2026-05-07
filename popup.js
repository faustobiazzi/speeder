function sendSpeed(speed) {
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, {action: "setSpeed", speed: speed}, (response) => {
      const statusEl = document.getElementById('status');
      
      if (response && response.success) {
        statusEl.style.color = "#0f0";
        statusEl.textContent = `aplicado ${response.count} midia(s) → ${response.speed}x`;
      } else {
        statusEl.style.color = "#ff0";
        statusEl.textContent = `Nenhum player encontrado (reproduza o video primeiro)`;
      }
    });
  });
}

// Botões...
document.getElementById('speed2').addEventListener('click', () => sendSpeed(2));
document.getElementById('speed4').addEventListener('click', () => sendSpeed(4));
document.getElementById('speed8').addEventListener('click', () => sendSpeed(8));
document.getElementById('speed16').addEventListener('click', () => sendSpeed(16));
document.getElementById('reset').addEventListener('click', () => sendSpeed(1));