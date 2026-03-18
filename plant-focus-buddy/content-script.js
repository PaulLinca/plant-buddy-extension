(function () {
    if (!document.body) return;
    if (document.getElementById('pfb-overlay')) return;

    init();

    function formatTime(seconds) {
        if (seconds < 60) return seconds + 's';
        const m = Math.floor(seconds / 60);
        const h = Math.floor(m / 60);
        if (h > 0) return h + 'h ' + (m % 60) + 'm';
        return m + 'm';
    }

    function init() {
        chrome.storage.local.get(['plantHealth', 'plantVisible', 'plantPosition', 'plantType'], (data) => {
            const {plantHealth = 70, plantVisible = true, plantPosition = 'bottom-right', plantType = 'snake'} = data;
            PlantAssets.setType(plantType);

            // Create overlay
            const overlay = document.createElement('div');
            overlay.id = 'pfb-overlay';
            overlay.className = `pfb-overlay pfb-position-${plantPosition}`;

            const plantWrap = document.createElement('div');
            plantWrap.id = 'pfb-plant-wrap';

            const toggleBtn = document.createElement('button');
            toggleBtn.id = 'pfb-toggle-btn';
            toggleBtn.title = 'Hide plant (Alt+P)';
            toggleBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 12 12"><path d="M6 1 Q9 4 6 7 Q3 4 6 1Z" fill="white"/></svg>';

            overlay.appendChild(plantWrap);
            overlay.appendChild(toggleBtn);
            document.body.appendChild(overlay);

            // Show tab
            const showTab = document.createElement('div');
            showTab.id = 'pfb-show-tab';
            showTab.innerHTML = '<svg width="10" height="10" viewBox="0 0 12 12"><path d="M6 1 Q9 4 6 7 Q3 4 6 1Z" fill="white"/></svg>';
            document.body.appendChild(showTab);

            let currentHealth = plantHealth;

            // Render plant
            renderPlant(currentHealth, plantWrap);

            function showPlant() {
                chrome.storage.local.set({plantVisible: true});
                overlay.classList.remove('pfb-hidden');
                showTab.classList.remove('pfb-visible');
                renderPlant(currentHealth, plantWrap);
            }

            function hidePlant() {
                chrome.storage.local.set({plantVisible: false});
                overlay.classList.add('pfb-hidden');
                showTab.classList.add('pfb-visible');
            }

            // Apply visibility
            if (!plantVisible) {
                overlay.classList.add('pfb-hidden');
                showTab.classList.add('pfb-visible');
            }

            // Toggle button
            toggleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                hidePlant();
            });

            // Show tab
            showTab.addEventListener('click', () => {
                showPlant();
            });

            // Alt+P shortcut
            document.addEventListener('keydown', (e) => {
                if (e.altKey && e.key === 'p') {
                    if (overlay.classList.contains('pfb-hidden')) showPlant();
                    else hidePlant();
                }
            });

            // Plant click: show tooltip
            let tooltip = null;
            plantWrap.addEventListener('click', (e) => {
                e.stopPropagation();
                if (tooltip) {
                    tooltip.remove();
                    tooltip = null;
                    return;
                }
                chrome.runtime.sendMessage({type: 'GET_STATE'}, (state) => {
                    if (!state) return;
                    tooltip = document.createElement('div');
                    tooltip.id = 'pfb-tooltip';
                    tooltip.innerHTML = `
            <strong>Plant Focus Buddy</strong><br>
            Health: ${Math.round(state.plantHealth)}%<br>
            Today's focus: ${formatTime(state.sessionGoodTime)}<br>
            Today's distracted: ${formatTime(state.sessionBadTime)}
          `;
                    // Position near plant
                    const rect = plantWrap.getBoundingClientRect();
                    tooltip.style.bottom = (window.innerHeight - rect.top + 8) + 'px';
                    tooltip.style.right = (window.innerWidth - rect.right + 10) + 'px';
                    document.body.appendChild(tooltip);
                });
            });

            document.addEventListener('click', () => {
                if (tooltip) {
                    tooltip.remove();
                    tooltip = null;
                }
            });

            // Listen for health updates
            chrome.runtime.onMessage.addListener((msg) => {
                if (msg.type === 'HEALTH_UPDATE') {
                    currentHealth = msg.health;
                    if (!overlay.classList.contains('pfb-hidden')) {
                        renderPlant(currentHealth, plantWrap);
                        overlay.classList.add('pfb-state-changed');
                        setTimeout(() => overlay.classList.remove('pfb-state-changed'), 1000);
                    }
                }
            });
        });
    }

    // MutationObserver to re-inject if overlay is removed
    const observer = new MutationObserver(() => {
        if (!document.getElementById('pfb-overlay') && document.body) {
            observer.disconnect();
            // Re-run
            if (typeof renderPlant === 'function') {
                init();
            }
        }
    });
    observer.observe(document.body, {childList: true});
})();
