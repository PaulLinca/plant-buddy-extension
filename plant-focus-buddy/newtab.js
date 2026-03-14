function formatTime(seconds) {
  if (seconds < 60) return seconds + 's';
  const m = Math.floor(seconds / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return h + 'h ' + (m % 60) + 'm';
  return m + 'm';
}

function healthToStateName(health) {
  if (health >= 85) return 'Thriving';
  if (health >= 60) return 'Healthy';
  if (health >= 35) return 'Okay';
  if (health >= 10) return 'Wilting';
  return 'Dead';
}

function updateUI(state) {
  const { plantHealth = 70, sessionGoodTime = 0, sessionBadTime = 0, streak = 0 } = state;

  const plantWrap = document.getElementById('newtab-plant-wrap');
  renderPlant(plantHealth, plantWrap);

  document.getElementById('health-pct').textContent = Math.round(plantHealth);
  document.getElementById('health-bar').style.width = plantHealth + '%';
  document.getElementById('state-label').textContent = healthToStateName(plantHealth);
  document.getElementById('stat-good').textContent = formatTime(sessionGoodTime);
  document.getElementById('stat-bad').textContent = formatTime(sessionBadTime);
  document.getElementById('stat-streak').textContent = streak;

  // Background tint
  document.body.classList.remove('tint-wilting', 'tint-dead');
  if (plantHealth < 10) document.body.classList.add('tint-dead');
  else if (plantHealth < 35) document.body.classList.add('tint-wilting');
}

function fetchAndRender() {
  try {
    chrome.runtime.sendMessage({ type: 'GET_STATE' }, (state) => {
      if (chrome.runtime.lastError) {
        // Service worker not ready, retry
        setTimeout(fetchAndRender, 500);
        return;
      }
      if (state) updateUI(state);
    });
  } catch (e) {
    setTimeout(fetchAndRender, 500);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  fetchAndRender();
  setInterval(fetchAndRender, 10000);

  document.getElementById('manage-sites-link').addEventListener('click', (e) => {
    e.preventDefault();
    // Can't directly open popup, but we can signal user
    alert('Click the Plant Focus Buddy icon in your toolbar to manage sites.');
  });
});
