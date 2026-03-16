(function () {
    const url = (f) => chrome.runtime.getURL('assets/' + f);
    const pot = { src: url('pot.png'), x: 0, y: 80, width: 100, height: 70 };
    const plant = (file, animation, duration) => ({
        src: url(file), x: 0, y: 0, width: 100, height: 100,
        animation, pivot: { x: 0.5, y: 1.0 }, duration
    });

    PlantAssets.register('THRIVING', { layers: [ pot, plant('plant-thriving.png', 'sway', 5)   ] });
    PlantAssets.register('HEALTHY',  { layers: [ pot, plant('plant-healthy.png',  'sway', 5)   ] });
    PlantAssets.register('OKAY',     { layers: [ pot, plant('plant-okay.png',     'sway', 6)   ] });
    PlantAssets.register('WILTING',  { layers: [ pot, plant('plant-wilting.png',  'bob',  3.5) ] });
    PlantAssets.register('DEAD',     { layers: [ pot, plant('plant-dead.png',     'none', 0)   ] });
})();
