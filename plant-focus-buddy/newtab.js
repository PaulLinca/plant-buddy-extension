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

function renderShortcuts(goodSites) {
  const row = document.getElementById('shortcuts-row');
  row.innerHTML = '';
  (goodSites || []).forEach(domain => {
    const a = document.createElement('a');
    a.className = 'shortcut';
    a.href = 'https://' + domain;

    const icon = document.createElement('div');
    icon.className = 'shortcut-icon';

    const img = document.createElement('img');
    img.width = 28;
    img.height = 28;
    img.src = 'https://www.google.com/s2/favicons?domain=' + domain + '&sz=64';
    img.onerror = () => {
      img.style.display = 'none';
      const letter = document.createElement('span');
      letter.className = 'shortcut-letter';
      letter.textContent = domain[0];
      icon.appendChild(letter);
    };
    icon.appendChild(img);

    const label = document.createElement('div');
    label.className = 'shortcut-label';
    label.textContent = domain.replace(/\.(com|org|net|io|app|so)$/, '');

    a.appendChild(icon);
    a.appendChild(label);
    row.appendChild(a);
  });
}

function updateUI(state) {
  const { plantHealth = 70, sessionGoodTime = 0, sessionBadTime = 0, streak = 0, goodSites = [], darkMode = false } = state;
  document.documentElement.classList.toggle('dark', darkMode);
  document.body.classList.toggle('dark', darkMode);
  renderShortcuts(goodSites);

  const plantWrap = document.getElementById('newtab-plant-wrap');
  renderPlant(plantHealth, plantWrap);

  document.getElementById('health-pct').textContent = Math.round(plantHealth);
  document.getElementById('health-bar').style.width = plantHealth + '%';
  document.getElementById('health-glow').style.width = plantHealth + '%';
  document.getElementById('state-label').textContent = healthToStateName(plantHealth);
  document.getElementById('stat-good').textContent = formatTime(sessionGoodTime);
  document.getElementById('stat-bad').textContent = formatTime(sessionBadTime);
  document.getElementById('stat-streak').textContent = streak;

  // Background tint
  document.body.classList.remove('tint-wilting', 'tint-dead');
  if (plantHealth < 10) document.body.classList.add('tint-dead');
  else if (plantHealth < 35) document.body.classList.add('tint-wilting');
}

function updateClock() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  document.getElementById('clock').textContent = h + ':' + m;

  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  document.getElementById('date-label').textContent =
    days[now.getDay()] + ', ' + months[now.getMonth()] + ' ' + now.getDate();
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
  updateClock();
  setInterval(updateClock, 1000);

  fetchAndRender();
  setInterval(fetchAndRender, 10000);

  document.getElementById('manage-sites-link').addEventListener('click', (e) => {
    e.preventDefault();
    // Can't directly open popup, but we can signal user
    alert('Click the Plant Focus Buddy icon in your toolbar to manage sites.');
  });
});
