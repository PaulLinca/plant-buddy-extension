(function () {
    const url = (f) => chrome.runtime.getURL('assets/' + f);

    // Design canvas: all layer x/y/width/height are authored relative to this size.
    const canvas = { width: 224, height: 290 };

    // Each plant type has 5 assets (one per health state), pot included in the image.
    const TYPES = {
        snake: {
            THRIVING: 'snake-thriving.png',
            HEALTHY:  'snake-healthy.png',
            OKAY:     'snake-okay.png',
            WILTING:  'snake-wilting.png',
            DEAD:     'snake-dead.png',
        },
        monstera: {
            THRIVING: 'monstera-thriving.png',
            HEALTHY:  'monstera-healthy.png',
            OKAY:     'monstera-okay.png',
            WILTING:  'monstera-wilting.png',
            DEAD:     'monstera-dead.png',
        },
        pothos: {
            THRIVING: 'pothos-thriving.png',
            HEALTHY:  'pothos-healthy.png',
            OKAY:     'pothos-okay.png',
            WILTING:  'pothos-wilting.png',
            DEAD:     'pothos-dead.png',
        },
        lily: {
            THRIVING: 'lily-thriving.png',
            HEALTHY:  'lily-healthy.png',
            OKAY:     'lily-okay.png',
            WILTING:  'lily-wilting.png',
            DEAD:     'lily-dead.png',
        }
    };

    function registerType(type) {
        const states = TYPES[type] || TYPES.snake;
        PlantAssets.clear();
        Object.entries(states).forEach(([state, file]) => {
            PlantAssets.register(state, {
                canvas,
                layers: [{
                    src: url(file),
                    x: 0, y: 0, width: 224, height: 290,
                }]
            });
        });
    }

    PlantAssets.setType = function (type) {
        registerType(type || 'snake');
    };

    // Default to snake plant on load
    registerType('snake');
})();