function sendCommand(action) {
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, {action: action}, (response) => {
      const status = document.getElementById('status');
      if (response) {
        status.style.color = response.success ? "#0f0" : "#ff0";
        status.textContent = response.message;
      }
    });
  });
}

// Velocidades
document.getElementById('speed025').addEventListener('click', () => sendCommand("setSpeed", 0.25));
document.getElementById('speed05').addEventListener('click', () => sendCommand("setSpeed", 0.5));
document.getElementById('speed2').addEventListener('click', () => sendCommand("setSpeed", 2));
document.getElementById('speed4').addEventListener('click', () => sendCommand("setSpeed", 4));
document.getElementById('speed8').addEventListener('click', () => sendCommand("setSpeed", 8));
document.getElementById('speed16').addEventListener('click', () => sendCommand("setSpeed", 16));

document.getElementById('reset').addEventListener('click', () => sendCommand("setSpeed", 1));

document.getElementById('downloadDirectVideo').addEventListener('click', () => sendCommand("downloadDirectVideo"));
document.getElementById('downloadDirectAudio').addEventListener('click', () => sendCommand("downloadDirectAudio"));
document.getElementById('downloadRecord').addEventListener('click', () => sendCommand("downloadRecord"));