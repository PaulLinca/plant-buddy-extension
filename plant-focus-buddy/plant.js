/**
 * Plant Buddy — Asset-driven plant renderer
 *
 * ── Public API ──────────────────────────────────────────────────────────────
 *
 *   renderPlant(health, containerEl)
 *     Renders the plant for a given health value (0–100).
 *     Uses registered assets if available, otherwise falls back to built-in.
 *
 *   PlantAssets.register(state, config)
 *     Registers an asset config for a health state before calling renderPlant.
 *
 * ── Health → State mapping ───────────────────────────────────────────────────
 *   85–100 → THRIVING
 *   60–84  → HEALTHY
 *   35–59  → OKAY
 *   10–34  → WILTING
 *   0–9    → DEAD
 *
 * ── Usage example ────────────────────────────────────────────────────────────
 *
 *   PlantAssets.register('THRIVING', {
 *     layers: [
 *       // Static layer — no animation
 *       {
 *         src: 'assets/pot.png',
 *         x: 10, y: 80, width: 80, height: 70
 *       },
 *
 *       // Motion-animated layer — image sways on a pivot
 *       {
 *         src:       'assets/plant-thriving.png',
 *         x: 0, y: 10, width: 100, height: 80,
 *         animation: 'sway',
 *         pivot:     { x: 0.5, y: 1.0 },  // bottom-center pivot (default)
 *         duration:  5,                    // seconds
 *         delay:     0
 *       },
 *
 *       // Sprite sheet layer — steps through frames automatically
 *       {
 *         src:    'assets/idle-sprite.png',
 *         x: 5, y: 5, width: 90, height: 90,
 *         sprite: {
 *           frames:      8,    // total frame count
 *           cols:        8,    // columns in the sheet
 *           frameWidth:  90,   // source px per frame (horizontal)
 *           frameHeight: 90,   // source px per frame (vertical)
 *           fps:         12,   // playback speed
 *           direction:   'horizontal'  // 'horizontal' (default) | 'vertical'
 *         },
 *         animation: 'sway',  // motion stacks on top of sprite playback
 *         pivot:     { x: 0.5, y: 1.0 }
 *       }
 *     ]
 *   });
 *
 *   // Animation types: 'sway' | 'bob' | 'breathe' | 'none'
 *   // Rendering hint:  'auto' (default) | 'pixelated' | 'crisp-edges'
 */

// ─── Asset Registry ───────────────────────────────────────────

var PlantAssets = (() => {
    const _r = {};
    return {
        register(state, config) { _r[state.toUpperCase()] = config; },
        get(state)              { return _r[state] || null; },
        clear(state)            { if (state) delete _r[state.toUpperCase()]; else Object.keys(_r).forEach(k => delete _r[k]); }
    };
})();

// ─── Health → State ───────────────────────────────────────────

function healthToState(h) {
    if (h >= 85) return 'THRIVING';
    if (h >= 60) return 'HEALTHY';
    if (h >= 35) return 'OKAY';
    if (h >= 10) return 'WILTING';
    return 'DEAD';
}

// ─── Layer Renderer ───────────────────────────────────────────

const _MOTION = {
    sway:    'pfb-anim-sway',
    bob:     'pfb-anim-bob',
    breathe: 'pfb-anim-breathe'
};

function _renderLayer(layer, wrapper, onImageError) {
    const {
        src,
        x         = 0,
        y         = 0,
        width,
        height,
        sprite,
        animation = 'none',
        pivot     = { x: 0.5, y: 1.0 },
        duration,
        delay     = 0,
        rendering = 'auto'
    } = layer;

    // Outer div — owns position and motion animation
    const outer = document.createElement('div');
    outer.className = 'pfb-layer';
    Object.assign(outer.style, {
        position:        'absolute',
        left:            x      + 'px',
        top:             y      + 'px',
        width:           width  + 'px',
        height:          height + 'px',
        transformOrigin: `${pivot.x * 100}% ${pivot.y * 100}%`,
        overflow:        'hidden'
    });

    const motionClass = _MOTION[animation];
    if (motionClass) {
        outer.classList.add(motionClass);
        if (duration) outer.style.animationDuration = duration + 's';
        if (delay)    outer.style.animationDelay    = delay    + 's';
    }

    if (sprite) {
        // Inner div — sprite sheet animation via background-position steps
        const inner = document.createElement('div');
        const dir    = sprite.direction || 'horizontal';
        const frames = sprite.frames;
        const fps    = sprite.fps || 12;
        const fW     = sprite.frameWidth;
        const fH     = sprite.frameHeight;
        const dur    = frames / fps;

        Object.assign(inner.style, {
            width:            '100%',
            height:           '100%',
            backgroundImage:  `url(${src})`,
            backgroundRepeat: 'no-repeat',
            imageRendering:   rendering
        });

        if (dir === 'horizontal') {
            inner.style.backgroundSize = `${fW * (sprite.cols || frames)}px ${fH}px`;
            inner.style.setProperty('--pfb-sprite-end', `-${fW * frames}px`);
            inner.style.animation = `pfb-sprite-h ${dur}s steps(${frames}) infinite`;
        } else {
            inner.style.backgroundSize = `${fW}px ${fH * (sprite.rows || frames)}px`;
            inner.style.setProperty('--pfb-sprite-end', `-${fH * frames}px`);
            inner.style.animation = `pfb-sprite-v ${dur}s steps(${frames}) infinite`;
        }

        // Delay applies to sprite when no motion anim is stacking
        if (delay && !motionClass) inner.style.animationDelay = delay + 's';

        outer.appendChild(inner);
    } else {
        // Static image
        const img = document.createElement('img');
        img.src       = src;
        img.alt       = '';
        img.draggable = false;
        img.onerror   = () => { if (onImageError) onImageError(); };
        Object.assign(img.style, {
            width:          '100%',
            height:         '100%',
            display:        'block',
            userSelect:     'none',
            imageRendering: rendering,
            pointerEvents:  'none'
        });
        outer.appendChild(img);
    }

    wrapper.appendChild(outer);
}

// ─── Fallback: built-in flat SVG ─────────────────────────────
// Shown when no assets are registered for a state.

function _renderFallback(state, containerEl) {
    const COLORS = {
        THRIVING: { pot:'#E8745A', soil:'#C45A42', stem:'#4CAF72', leaf:'#3D9960', flower:'#F5C842', center:'#E8A020' },
        HEALTHY:  { pot:'#E8745A', soil:'#C45A42', stem:'#4CAF72', leaf:'#3D9960', flower:'#A8D8A0', center:'#78B870' },
        OKAY:     { pot:'#D4906A', soil:'#B87050', stem:'#7DAF50', leaf:'#5A8C38', flower:null,       center:null      },
        WILTING:  { pot:'#C4946E', soil:'#A07050', stem:'#A8A850', leaf:'#8C8838', flower:null,       center:null      },
        DEAD:     { pot:'#B0A090', soil:'#90807A', stem:'#909090', leaf:'#787878', flower:null,       center:null      }
    };
    const c = COLORS[state];

    function svgEl(tag, attrs) {
        const e = document.createElementNS('http://www.w3.org/2000/svg', tag);
        for (const k in attrs) e.setAttribute(k, attrs[k]);
        return e;
    }

    const svg = svgEl('svg', { viewBox: '0 0 120 180' });

    svg.appendChild(svgEl('rect', { x:30, y:118, width:60, height:8,  rx:4, fill:c.soil }));
    svg.appendChild(svgEl('path', { d:'M 34 126 L 38 164 Q 38 168 60 168 Q 82 168 82 164 L 86 126 Z', fill:c.pot }));
    svg.appendChild(svgEl('rect', { x:30, y:118, width:60, height:8,  rx:4, fill:c.soil }));

    const stemH = { THRIVING:58, HEALTHY:52, OKAY:44, WILTING:36, DEAD:30 }[state];
    const bX = 60, bY = 120, tipY = bY - stemH;

    const plant = svgEl('g', { class:`plant-stem-group state-${state.toLowerCase()}` });

    plant.appendChild(svgEl('rect', { x:bX-3, y:tipY, width:6, height:stemH, rx:3, fill:c.stem }));

    const leafCfgs = {
        THRIVING: [{t:.35,s:1,rx:14,ry:7},{t:.35,s:-1,rx:12,ry:6},{t:.68,s:1,rx:11,ry:5},{t:.68,s:-1,rx:13,ry:6}],
        HEALTHY:  [{t:.38,s:1,rx:13,ry:6},{t:.38,s:-1,rx:11,ry:5},{t:.70,s:1,rx:10,ry:5}],
        OKAY:     [{t:.40,s:1,rx:12,ry:5},{t:.40,s:-1,rx:10,ry:5}],
        WILTING:  [{t:.45,s:1,rx:10,ry:4},{t:.45,s:-1,rx:9, ry:4}],
        DEAD:     [{t:.50,s:1,rx:8, ry:3}]
    }[state];

    leafCfgs.forEach(({ t, s, rx, ry }) => {
        const y  = bY - stemH * t;
        const cx = bX + s * (rx + 3);
        plant.appendChild(svgEl('ellipse', { cx, cy:y, rx, ry, fill:c.leaf, transform:`rotate(${s>0?-20:20},${cx},${y})` }));
    });

    if (c.flower) {
        for (let i = 0; i < 5; i++) {
            const a = (i / 5) * Math.PI * 2;
            plant.appendChild(svgEl('circle', { cx:bX+Math.cos(a)*8, cy:tipY-8+Math.sin(a)*8, r:6, fill:c.flower }));
        }
        plant.appendChild(svgEl('circle', { cx:bX, cy:tipY-8, r:6, fill:c.center }));
    }

    if (state === 'DEAD') {
        plant.appendChild(svgEl('circle', { cx:bX, cy:tipY-4, r:5, fill:c.stem }));
    }

    svg.appendChild(plant);
    containerEl.appendChild(svg);
}

// ─── Public API ───────────────────────────────────────────────

function renderPlant(health, containerEl) {
    containerEl.innerHTML = '';
    const state  = healthToState(health);
    const config = PlantAssets.get(state);

    if (!config) {
        _renderFallback(state, containerEl);
        return;
    }

    const wrapper = document.createElement('div');
    wrapper.className = `pfb-plant-asset-wrap state-${state.toLowerCase()}`;
    Object.assign(wrapper.style, {
        position: 'relative',
        width:    '100%',
        height:   '100%'
    });

    let fellBack = false;
    function onImageError() {
        if (fellBack) return;
        fellBack = true;
        containerEl.innerHTML = '';
        _renderFallback(state, containerEl);
    }

    (config.layers || []).forEach(layer => _renderLayer(layer, wrapper, onImageError));

    containerEl.appendChild(wrapper);
}
