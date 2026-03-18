function todayString() {
  return new Date().toISOString().slice(0, 10);
}

const DEFAULTS = {
  plantHealth: 70,
  plantType: 'snake',
  goodSites: ['notion.so', 'github.com', 'docs.google.com', 'linear.app'],
  badSites: ['reddit.com', 'youtube.com', 'twitter.com', 'x.com', 'instagram.com'],
  plantVisible: true,
  plantPosition: 'bottom-right',
  sessionGoodTime: 0,
  sessionBadTime: 0,
  lastResetDate: todayString(),
  darkMode: false,
  totalGoodTime: 0,
  totalBadTime: 0
};

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  if (reason === 'install') {
    await chrome.storage.local.set(DEFAULTS);
    chrome.alarms.create('healthTick', { periodInMinutes: 10 / 60 });
  }
  if (reason === 'update') {
    const existing = await chrome.storage.local.get(null);
    const merged = { ...DEFAULTS, ...existing };
    await chrome.storage.local.set(merged);
  }
});

// Re-create alarm if service worker restarts (alarm may still exist, create is idempotent)
chrome.alarms.get('healthTick', (alarm) => {
  if (!alarm) {
    chrome.alarms.create('healthTick', { periodInMinutes: 10 / 60 });
  }
});

function classifyTab(tab, goodSites, badSites) {
  if (!tab || !tab.url) return 'neutral';
  let hostname;
  try {
    hostname = new URL(tab.url).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return 'neutral';
  }
  const matches = (list) => list.some(domain => {
    const d = domain.toLowerCase().replace(/^www\./, '');
    return hostname === d || hostname.endsWith('.' + d);
  });
  if (matches(goodSites)) return 'good';
  if (matches(badSites)) return 'bad';
  return 'neutral';
}

async function broadcastHealthUpdate(health, siteType) {
  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) {
    try {
      await chrome.tabs.sendMessage(tab.id, { type: 'HEALTH_UPDATE', health, siteType });
    } catch (_) {
      // Tab may not have content script — ignore
    }
  }
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== 'healthTick') return;
  const data = await chrome.storage.local.get(null);
  let { plantHealth, goodSites, badSites, sessionGoodTime, sessionBadTime, lastResetDate, totalGoodTime, totalBadTime } = data;

  // 1. Daily reset check
  const today = todayString();
  if (lastResetDate !== today) {
    plantHealth = 70;
    sessionGoodTime = 0;
    sessionBadTime = 0;
    lastResetDate = today;
  }

  // 2. Get currently active tab
  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const siteType = classifyTab(activeTab, goodSites || [], badSites || []);

  // 3. Update session tracking
  if (siteType === 'good') {
    sessionGoodTime += 10;
    totalGoodTime += 10;
  }
  if (siteType === 'bad') {
    sessionBadTime += 10;
    totalBadTime += 10;
  }

  // 4. Calculate health from focus/distraction ratio.
  // At 0/0 (no tracked activity) → 70%. More focus than distraction → above 70%, and vice versa.
  const totalTracked = sessionGoodTime + sessionBadTime;
  if (totalTracked === 0) {
    plantHealth = 70;
  } else {
    const ratio = sessionGoodTime / totalTracked;
    plantHealth = Math.max(0, Math.min(100, Math.round(70 + (ratio - 0.5) * 100)));
  }

  // 5. Persist
  await chrome.storage.local.set({ plantHealth, sessionGoodTime, sessionBadTime, lastResetDate, totalGoodTime, totalBadTime });

  // 6. Broadcast to all content scripts
  broadcastHealthUpdate(plantHealth, siteType);
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'GET_STATE') {
    chrome.storage.local.get(null).then(sendResponse);
    return true;
  }
  if (msg.type === 'RESET_PLANT') {
    chrome.storage.local.set({ plantHealth: 70 }).then(() => {
      sendResponse({ ok: true });
      broadcastHealthUpdate(70, 'neutral');
    });
    return true;
  }
});
