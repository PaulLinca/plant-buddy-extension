(function () {
    if (!document.body) return;
    if (document.getElementById('pfb-overlay')) return;

    let overlayEnabled = true;

    function formatTime(seconds) {
        if (seconds < 60) return seconds + 's';
        const m = Math.floor(seconds / 60);
        const h = Math.floor(m / 60);
        if (h > 0) return h + 'h ' + (m % 60) + 'm';
        return m + 'm';
    }

    function teardown() {
        const ov = document.getElementById('pfb-overlay');
        if (ov) ov.remove();
        const tab = document.getElementById('pfb-show-tab');
        if (tab) tab.remove();
    }

    function init() {
        chrome.storage.local.get(['plantHealth', 'plantVisible', 'plantPosition', 'plantType'], (data) => {
            const {plantHealth = 70, plantVisible = true, plantPosition = 'bottom-right', plantType = 'snake'} = data;

            overlayEnabled = plantVisible;
            if (!overlayEnabled) return;

            PlantAssets.setType(plantType);

            // Create overlay
            const overlay = document.createElement('div');
            overlay.id = 'pfb-overlay';
            overlay.className = `pfb-overlay pfb-position-${plantPosition}`;

            const plantWrap = document.createElement('div');
            plantWrap.id = 'pfb-plant-wrap';

            overlay.appendChild(plantWrap);
            document.body.appendChild(overlay);

            // Show tab
            const showTab = document.createElement('div');
            showTab.id = 'pfb-show-tab';
            showTab.className = `pfb-show-tab pfb-position-${plantPosition}`;
            const arrowRight = '<svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M3 1.5l4 3.5-4 3.5" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
            const arrowLeft  = '<svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M7 1.5L3 5l4 3.5" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
            showTab.innerHTML = plantPosition.endsWith('left') ? arrowRight : arrowLeft;
            document.body.appendChild(showTab);

            let currentHealth = plantHealth;

            renderPlant(currentHealth, plantWrap);

            function showPlant() {
                overlay.classList.remove('pfb-hidden');
                showTab.classList.remove('pfb-visible');
                renderPlant(currentHealth, plantWrap);
            }

            function hidePlant() {
                overlay.classList.add('pfb-hidden');
                showTab.classList.add('pfb-visible');
            }

            // Show tab click
            showTab.addEventListener('click', () => showPlant());

            // Plant click: hide for this session
            plantWrap.addEventListener('click', (e) => {
                e.stopPropagation();
                hidePlant();
            });

            // Hover tooltip
            let tooltip = null;
            plantWrap.addEventListener('mouseenter', () => {
                chrome.runtime.sendMessage({type: 'GET_STATE'}, (state) => {
                    if (!state || tooltip) return;
                    tooltip = document.createElement('div');
                    tooltip.id = 'pfb-tooltip';
                    const stateName = state.plantHealth >= 85 ? 'Thriving' : state.plantHealth >= 60 ? 'Healthy' : state.plantHealth >= 35 ? 'Okay' : state.plantHealth >= 10 ? 'Wilting' : 'Dead';
                    tooltip.innerHTML = `<strong>${stateName}</strong> · ${Math.round(state.plantHealth)}%<br><span>Focus ${formatTime(state.sessionGoodTime)} · Distracted ${formatTime(state.sessionBadTime)}</span>`;
                    const rect = plantWrap.getBoundingClientRect();
                    const isTop  = plantPosition.startsWith('top');
                    const isLeft = plantPosition.endsWith('left');
                    if (isTop)  tooltip.style.top    = (rect.bottom + 8) + 'px';
                    else        tooltip.style.bottom  = (window.innerHeight - rect.top + 8) + 'px';
                    if (isLeft) tooltip.style.left    = rect.left + 'px';
                    else        tooltip.style.right   = (window.innerWidth - rect.right) + 'px';
                    document.body.appendChild(tooltip);
                });
            });

            plantWrap.addEventListener('mouseleave', () => {
                if (tooltip) { tooltip.remove(); tooltip = null; }
            });

            // Alt+P shortcut
            document.addEventListener('keydown', (e) => {
                if (e.altKey && e.key === 'p') {
                    if (overlay.classList.contains('pfb-hidden')) showPlant();
                    else hidePlant();
                }
            });

            // Listen for updates from background
            chrome.runtime.onMessage.addListener((msg) => {
                if (msg.type === 'HEALTH_UPDATE') {
                    currentHealth = msg.health;
                    if (!overlay.classList.contains('pfb-hidden')) {
                        renderPlant(currentHealth, plantWrap);
                        overlay.classList.add('pfb-state-changed');
                        setTimeout(() => overlay.classList.remove('pfb-state-changed'), 1000);
                    }
                }
                if (msg.type === 'OVERLAY_VISIBLE') {
                    overlayEnabled = msg.visible;
                    if (!msg.visible) {
                        teardown();
                    } else if (!document.getElementById('pfb-overlay')) {
                        init();
                    }
                }
            });
        });
    }

    // Listen for enable/disable before init completes
    chrome.runtime.onMessage.addListener((msg) => {
        if (msg.type === 'OVERLAY_VISIBLE') {
            overlayEnabled = msg.visible;
            if (!msg.visible) {
                teardown();
            } else if (!document.getElementById('pfb-overlay')) {
                init();
            }
        }
    });

    init();

    // MutationObserver to re-inject if overlay is removed by the page
    const observer = new MutationObserver(() => {
        if (!document.getElementById('pfb-overlay') && document.body && overlayEnabled) {
            observer.disconnect();
            init();
        }
    });
    observer.observe(document.body, {childList: true});
})();
