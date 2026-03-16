(function () {
    const url = (f) => chrome.runtime.getURL('assets/' + f);

    // Design canvas: all layer x/y/width/height are authored relative to this size.
    // renderPlant will scale this canvas as a unit to fit any container.
    const canvas = { width: 224, height: 290 };

    const pot = { src: url('pot.png'), x: 50, y: 162, width: 128, height: 128 };
    const plant = (file, animation, duration) => ({
        src: url(file), x: 0, y: 20, width: 224, height: 200,
        animation, pivot: { x: 0.5, y: 1.0 }, duration
    });

    PlantAssets.register('THRIVING', { canvas, layers: [ pot, plant('plant-thriving.png', 'sway', 5)   ] });
    PlantAssets.register('HEALTHY',  { canvas, layers: [ pot, plant('plant-healthy.png',  'sway', 5)   ] });
    PlantAssets.register('OKAY',     { canvas, layers: [ pot, plant('plant-okay.png',     'sway', 6)   ] });
    PlantAssets.register('WILTING',  { canvas, layers: [ pot, plant('plant-wilting.png',  'bob',  3.5) ] });
    PlantAssets.register('DEAD',     { canvas, layers: [ pot, plant('plant-dead.png',     'none', 0)   ] });
})();
