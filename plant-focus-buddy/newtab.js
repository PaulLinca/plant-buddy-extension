chrome.storage.local.get('darkMode', ({ darkMode }) => {
  if (darkMode) document.documentElement.classList.add('dark');
});

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
  const { plantHealth = 70, plantType = 'snake', sessionGoodTime = 0, sessionBadTime = 0, streak = 0, goodSites = [], darkMode = false } = state;
  document.documentElement.classList.toggle('dark', darkMode);
  document.body.classList.toggle('dark', darkMode);
  renderShortcuts(goodSites);

  const plantWrap = document.getElementById('newtab-plant-wrap');
  PlantAssets.setType(plantType);
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

function initTestView() {
  const STATES = [
    { name: 'Thriving', health: 92 },
    { name: 'Healthy',  health: 72 },
    { name: 'Okay',     health: 47 },
    { name: 'Wilting',  health: 20 },
    { name: 'Dead',     health: 4  },
  ];

  const row = document.getElementById('test-states-row');
  STATES.forEach(({ name, health }) => {
    const card = document.createElement('div');
    card.className = 'test-state-card';

    const wrap = document.createElement('div');
    wrap.className = 'test-plant-wrap';
    wrap.dataset.health = health; // rendered lazily when overlay opens

    const label = document.createElement('div');
    label.className = `test-state-name state-${name.toLowerCase()}`;
    label.textContent = name;

    const val = document.createElement('div');
    val.className = 'test-health-val';
    val.textContent = health + '%';

    card.appendChild(wrap);
    card.appendChild(label);
    card.appendChild(val);
    row.appendChild(card);
  });

  document.getElementById('test-toggle-btn').addEventListener('click', () => {
    const overlay = document.getElementById('test-overlay');
    overlay.classList.add('visible');
    // Render plants now that the overlay is visible and containers have layout dimensions.
    overlay.querySelectorAll('.test-plant-wrap[data-health]').forEach(wrap => {
      renderPlant(parseInt(wrap.dataset.health), wrap);
      delete wrap.dataset.health;
    });
  });
  document.getElementById('test-close-btn').addEventListener('click', () => {
    document.getElementById('test-overlay').classList.remove('visible');
  });
  document.getElementById('test-overlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) {
      e.currentTarget.classList.remove('visible');
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  updateClock();
  setInterval(updateClock, 1000);
  initTestView();

  fetchAndRender();
  setInterval(fetchAndRender, 10000);

  document.getElementById('manage-sites-link').addEventListener('click', (e) => {
    e.preventDefault();
    // Can't directly open popup, but we can signal user
    alert('Click the Plant Focus Buddy icon in your toolbar to manage sites.');
  });
});
