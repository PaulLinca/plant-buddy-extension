let appState = {};

function healthToMessage(health) {
    if (health >= 85) return 'Your plant is loving this! Keep the focus going.';
    if (health >= 60) return 'Looking good! You\'re on the right track!';
    if (health >= 35) return 'Hanging in there, keep going!';
    if (health >= 10) return 'Your plant is stressed. Time to refocus.';
    return 'Time to step away from the distractions.';
}

function healthToStateName(health) {
  if (health >= 85) return 'Thriving';
  if (health >= 60) return 'Healthy';
  if (health >= 35) return 'Okay';
  if (health >= 10) return 'Wilting';
  return 'Dead';
}

function normalizeDomain(input) {
  let d = input.trim().toLowerCase();
  d = d.replace(/^https?:\/\//, '');
  d = d.replace(/^www\./, '');
  d = d.replace(/\/.*$/, '');
  return d;
}

function isValidDomain(d) {
  return /^[a-z0-9]([a-z0-9\-\.]+)?[a-z0-9]\.[a-z]{2,}$/.test(d);
}

function renderSitesList(containerId, sites, type) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  (sites || []).forEach(domain => {
    const tag = document.createElement('div');
    tag.className = `site-tag${type === 'bad' ? ' bad' : ''}`;
    const span = document.createElement('span');
    span.textContent = domain;
    const btn = document.createElement('button');
    btn.textContent = '×';
    btn.title = 'Remove';
    btn.addEventListener('click', async () => {
      if (type === 'good') {
        const { goodSites = [] } = await chrome.storage.local.get('goodSites');
        await chrome.storage.local.set({ goodSites: goodSites.filter(d => d !== domain) });
      } else {
        const { badSites = [] } = await chrome.storage.local.get('badSites');
        await chrome.storage.local.set({ badSites: badSites.filter(d => d !== domain) });
      }
      loadState();
    });
    tag.appendChild(span);
    tag.appendChild(btn);
    container.appendChild(tag);
  });
}

function renderPositionButtons(currentPos) {
  document.querySelectorAll('.pos-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.pos === currentPos);
  });
}

function renderPlantTypeButtons(currentType) {
  document.querySelectorAll('.plant-type-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.type === currentType);
  });
}

function loadState() {
  chrome.runtime.sendMessage({ type: 'GET_STATE' }, (state) => {
    if (!state) return;
    appState = state;
    const { plantHealth = 70, plantType = 'snake', plantVisible = true, plantPosition = 'bottom-right', darkMode = false, goodSites = [], badSites = [] } = state;

    document.body.classList.toggle('dark', darkMode);
    document.getElementById('dark-mode-toggle').checked = darkMode;

    // Plant header
    const plantWrap = document.getElementById('popup-plant-wrap');
    PlantAssets.setType(plantType);
    renderPlant(plantHealth, plantWrap);

    // Health ring
    document.getElementById('health-num').textContent = Math.round(plantHealth);
    document.getElementById('health-state').textContent = healthToStateName(plantHealth);
    document.getElementById('health-message').textContent = healthToMessage(plantHealth);
    const arc = document.getElementById('health-ring-arc');
    if (arc) {
      const circumference = 188.5;
      arc.style.strokeDashoffset = (circumference * (1 - plantHealth / 100)).toFixed(2);
      const ringColor = plantHealth >= 60 ? '#7FFFA0' : plantHealth >= 35 ? '#FFD166' : plantHealth >= 10 ? '#FF9A5C' : '#AAAAAA';
      arc.style.stroke = ringColor;
    }

    // Toggle
    document.getElementById('plant-visible-toggle').checked = plantVisible;

    // Plant type
    renderPlantTypeButtons(plantType);

    // Position
    renderPositionButtons(plantPosition);

    // Sites
    renderSitesList('good-sites-list', goodSites, 'good');
    renderSitesList('bad-sites-list', badSites, 'bad');
  });
}

document.addEventListener('DOMContentLoaded', () => {
  loadState();

  // Visibility toggle
  document.getElementById('plant-visible-toggle').addEventListener('change', async (e) => {
    await chrome.storage.local.set({ plantVisible: e.target.checked });
  });

  // Dark mode toggle
  document.getElementById('dark-mode-toggle').addEventListener('change', async (e) => {
    const darkMode = e.target.checked;
    await chrome.storage.local.set({ darkMode });
    document.body.classList.toggle('dark', darkMode);
  });

  // Plant type buttons
  document.querySelectorAll('.plant-type-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      await chrome.storage.local.set({ plantType: btn.dataset.type });
      renderPlantTypeButtons(btn.dataset.type);
      PlantAssets.setType(btn.dataset.type);
      const plantWrap = document.getElementById('popup-plant-wrap');
      renderPlant(appState.plantHealth ?? 70, plantWrap);
    });
  });

  // Position buttons
  document.querySelectorAll('.pos-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      await chrome.storage.local.set({ plantPosition: btn.dataset.pos });
      renderPositionButtons(btn.dataset.pos);
    });
  });

  // Add good site
  document.getElementById('add-good-btn').addEventListener('click', async () => {
    const input = document.getElementById('good-site-input');
    const errEl = document.getElementById('good-error');
    const domain = normalizeDomain(input.value);
    errEl.textContent = '';

    if (!isValidDomain(domain)) {
      errEl.textContent = 'Enter a valid domain (e.g. notion.so)';
      return;
    }
    const { badSites = [] } = await chrome.storage.local.get('badSites');
    if (badSites.includes(domain)) {
      errEl.textContent = 'Already in bad sites';
      return;
    }
    const { goodSites = [] } = await chrome.storage.local.get('goodSites');
    if (!goodSites.includes(domain)) {
      await chrome.storage.local.set({ goodSites: [...goodSites, domain] });
    }
    input.value = '';
    loadState();
  });

  // Add bad site
  document.getElementById('add-bad-btn').addEventListener('click', async () => {
    const input = document.getElementById('bad-site-input');
    const errEl = document.getElementById('bad-error');
    const domain = normalizeDomain(input.value);
    errEl.textContent = '';

    if (!isValidDomain(domain)) {
      errEl.textContent = 'Enter a valid domain (e.g. reddit.com)';
      return;
    }
    const { goodSites = [] } = await chrome.storage.local.get('goodSites');
    if (goodSites.includes(domain)) {
      errEl.textContent = 'Already in good sites';
      return;
    }
    const { badSites = [] } = await chrome.storage.local.get('badSites');
    if (!badSites.includes(domain)) {
      await chrome.storage.local.set({ badSites: [...badSites, domain] });
    }
    input.value = '';
    loadState();
  });

  // Allow Enter key in inputs
  document.getElementById('good-site-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('add-good-btn').click();
  });
  document.getElementById('bad-site-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('add-bad-btn').click();
  });

  // Reset button (two-click confirm)
  let resetConfirming = false;
  const resetBtn = document.getElementById('reset-btn');
  resetBtn.addEventListener('click', async () => {
    if (!resetConfirming) {
      resetConfirming = true;
      resetBtn.textContent = 'Are you sure? Click again to confirm';
      resetBtn.classList.add('confirm');
      setTimeout(() => {
        resetConfirming = false;
        resetBtn.textContent = 'Reset Plant Health';
        resetBtn.classList.remove('confirm');
      }, 3000);
    } else {
      resetConfirming = false;
      resetBtn.textContent = 'Reset Plant Health';
      resetBtn.classList.remove('confirm');
      chrome.runtime.sendMessage({ type: 'RESET_PLANT' }, () => {
        loadState();
      });
    }
  });
});
