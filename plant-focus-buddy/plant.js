const STATE_COLORS = {
  THRIVING: { stemTop: '#3CB554', stemBot: '#1E6B2E', leafTop: '#5DD96E', leafBot: '#2A8A3A', leafStroke: '#1E6B2E', flower: '#FF8FAB', flowerCenter: '#FFD166', potTop: '#E05A2B', potBot: '#9B3415', rim: '#F07040', soil: '#6B3F1F', soilTop: '#8B5A2B' },
  HEALTHY:  { stemTop: '#3CB554', stemBot: '#1E6B2E', leafTop: '#5DD96E', leafBot: '#2A8A3A', leafStroke: '#1E6B2E', flower: '#FFCA28', flowerCenter: '#FF8F00', potTop: '#E05A2B', potBot: '#9B3415', rim: '#F07040', soil: '#6B3F1F', soilTop: '#8B5A2B' },
  OKAY:     { stemTop: '#7DB83A', stemBot: '#4A7A1E', leafTop: '#A0C840', leafBot: '#6A9020', leafStroke: '#4A7A1E', flower: null,       flowerCenter: null,     potTop: '#B06030', potBot: '#7A3E18', rim: '#C07040', soil: '#5A3418', soilTop: '#7A4A28' },
  WILTING:  { stemTop: '#B0A040', stemBot: '#7A6A18', leafTop: '#C8B848', leafBot: '#907828', leafStroke: '#7A6A18', flower: null,       flowerCenter: null,     potTop: '#9A6830', potBot: '#6A4010', rim: '#AA7840', soil: '#4A3018', soilTop: '#6A4228' },
  DEAD:     { stemTop: '#8A7848', stemBot: '#5A4C28', leafTop: '#9A8C60', leafBot: '#6A5C38', leafStroke: '#5A4C28', flower: null,       flowerCenter: null,     potTop: '#806040', potBot: '#503C20', rim: '#907050', soil: '#3C2C18', soilTop: '#5A3E28' }
};

function healthToState(health) {
  if (health >= 85) return 'THRIVING';
  if (health >= 60) return 'HEALTHY';
  if (health >= 35) return 'OKAY';
  if (health >= 10) return 'WILTING';
  return 'DEAD';
}

function svgEl(tag, attrs) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
}

function makeLinearGradient(defs, id, x1, y1, x2, y2, stops) {
  const grad = svgEl('linearGradient', { id, x1, y1, x2, y2, gradientUnits: 'userSpaceOnUse' });
  stops.forEach(([offset, color, opacity = 1]) => {
    const stop = svgEl('stop', { offset, 'stop-color': color, 'stop-opacity': opacity });
    grad.appendChild(stop);
  });
  defs.appendChild(grad);
}

function renderPlant(health, containerEl) {
  containerEl.innerHTML = '';
  const state = healthToState(health);
  const c = STATE_COLORS[state];

  const svg = svgEl('svg', { viewBox: '0 0 120 180', xmlns: 'http://www.w3.org/2000/svg' });

  // ── Defs: gradients ──────────────────────────────────────────────────────
  const defs = svgEl('defs', {});

  makeLinearGradient(defs, 'pfb-pot-grad',  30, 140, 90, 175, [['0%', c.potTop], ['100%', c.potBot]]);
  makeLinearGradient(defs, 'pfb-rim-grad',  35, 136, 85, 144, [['0%', c.rim],    ['100%', c.potBot]]);
  makeLinearGradient(defs, 'pfb-soil-grad', 35, 132, 85, 142, [['0%', c.soilTop],['100%', c.soil]]);
  makeLinearGradient(defs, 'pfb-stem-grad', 56,   0, 64, 0,   [['0%', c.stemTop],['100%', c.stemBot]]);
  makeLinearGradient(defs, 'pfb-leaf-l',     0,   0,  1, 0,   [['0%', c.leafTop],['100%', c.leafBot]]);
  makeLinearGradient(defs, 'pfb-leaf-r',     1,   0,  0, 0,   [['0%', c.leafTop],['100%', c.leafBot]]);

  svg.appendChild(defs);

  // ── Pot ──────────────────────────────────────────────────────────────────
  // Body (trapezoid with rounded bottom via path)
  const potBody = svgEl('path', {
    d: 'M 36 140 L 84 140 L 89 168 Q 89 172 85 172 L 35 172 Q 31 172 31 168 Z',
    fill: 'url(#pfb-pot-grad)'
  });
  // Highlight stripe on pot
  const potHighlight = svgEl('path', {
    d: 'M 40 142 L 42 170',
    stroke: 'rgba(255,255,255,0.18)', 'stroke-width': '3', 'stroke-linecap': 'round', fill: 'none'
  });
  // Rim
  const rim = svgEl('rect', {
    x: '33', y: '136', width: '54', height: '8', rx: '3',
    fill: 'url(#pfb-rim-grad)'
  });
  // Soil
  const soil = svgEl('ellipse', {
    cx: '60', cy: '140', rx: '24', ry: '6',
    fill: 'url(#pfb-soil-grad)'
  });
  // Small soil pebbles
  [[50,140],[60,142],[70,140],[55,138],[65,139]].forEach(([px,py]) => {
    const pebble = svgEl('ellipse', { cx: px, cy: py, rx: '2', ry: '1.2', fill: c.soil, opacity: '0.6' });
    svg.appendChild(pebble);
  });

  svg.appendChild(potBody);
  svg.appendChild(potHighlight);
  svg.appendChild(rim);
  svg.appendChild(soil);

  // ── Stem group (animated) ─────────────────────────────────────────────────
  const stemGroup = svgEl('g', { class: `plant-stem-group state-${state.toLowerCase()}` });

  const stemHeights = { THRIVING: 82, HEALTHY: 70, OKAY: 60, WILTING: 50, DEAD: 38 };
  const stemH = stemHeights[state];
  const stemTopY = 138 - stemH;

  // Stem path
  let stemD;
  if (state === 'WILTING') {
    stemD = `M 60 138 C 68 ${138 - stemH * 0.4} 72 ${138 - stemH * 0.7} 58 ${stemTopY}`;
  } else if (state === 'DEAD') {
    stemD = `M 60 138 C 58 ${138 - stemH * 0.4} 72 ${138 - stemH * 0.6} 68 ${stemTopY}`;
  } else {
    stemD = `M 60 138 C 58 ${138 - stemH * 0.33} 62 ${138 - stemH * 0.66} 60 ${stemTopY}`;
  }

  // Stem shadow
  stemGroup.appendChild(svgEl('path', {
    d: stemD, stroke: c.stemBot, 'stroke-width': '5.5', fill: 'none',
    'stroke-linecap': 'round', opacity: '0.4'
  }));
  // Stem main
  stemGroup.appendChild(svgEl('path', {
    d: stemD, stroke: 'url(#pfb-stem-grad)', 'stroke-width': '4', fill: 'none',
    'stroke-linecap': 'round'
  }));

  // ── Leaves ─────────────────────────────────────────────────────────────
  const leafDefs = {
    THRIVING: [
      { t: 0.30, side:  1, w: 32, h: 20, grad: 'pfb-leaf-r' },
      { t: 0.58, side: -1, w: 30, h: 18, grad: 'pfb-leaf-l' },
      { t: 0.82, side:  1, w: 24, h: 15, grad: 'pfb-leaf-r' },
    ],
    HEALTHY: [
      { t: 0.32, side:  1, w: 30, h: 18, grad: 'pfb-leaf-r' },
      { t: 0.65, side: -1, w: 28, h: 17, grad: 'pfb-leaf-l' },
    ],
    OKAY: [
      { t: 0.35, side:  1, w: 26, h: 16, grad: 'pfb-leaf-r' },
      { t: 0.68, side: -1, w: 24, h: 15, grad: 'pfb-leaf-l' },
    ],
    WILTING: [
      { t: 0.35, side:  1, w: 24, h: 14, droop: true, grad: 'pfb-leaf-r' },
      { t: 0.68, side: -1, w: 22, h: 14, droop: true, grad: 'pfb-leaf-l' },
    ],
    DEAD: [
      { t: 0.50, side:  1, w: 16, h:  9, dry: true, grad: 'pfb-leaf-r' },
    ],
  };

  // Approximate point on stem curve at parameter t (cubic bezier)
  function stemPoint(t) {
    // Parse stemD to get control points
    // M 60 138 C cx1 cy1 cx2 cy2 60/58/68 stemTopY
    const parts = stemD.replace(/[MC]/g, '').trim().split(/\s+/).map(Number);
    const [x0, y0, cx1, cy1, cx2, cy2, x3, y3] = parts;
    const mt = 1 - t;
    return {
      x: mt*mt*mt*x0 + 3*mt*mt*t*cx1 + 3*mt*t*t*cx2 + t*t*t*x3,
      y: mt*mt*mt*y0 + 3*mt*mt*t*cy1 + 3*mt*t*t*cy2 + t*t*t*y3
    };
  }

  (leafDefs[state] || []).forEach(({ t, side, w, h, droop, dry, grad }) => {
    const base = stemPoint(t);
    const bx = base.x, by = base.y;
    let leafPath;

    if (dry) {
      // Shrivelled angular leaf
      const tx = bx + side * w, ty = by - h * 0.3;
      leafPath = svgEl('path', {
        d: `M ${bx} ${by} L ${bx + side * w * 0.4} ${by - h * 0.6} L ${tx} ${ty} L ${bx + side * w * 0.6} ${by + h * 0.5} Z`,
        fill: `url(#${grad})`, stroke: c.leafStroke, 'stroke-width': '0.8', opacity: '0.75'
      });
    } else if (droop) {
      // Drooping leaf hangs downward
      const cx1 = bx + side * w * 0.5, cy1 = by - h * 0.3;
      const tx  = bx + side * w,       ty  = by + h * 0.4;
      const cx2 = bx + side * w * 0.7, cy2 = by + h * 1.1;
      leafPath = svgEl('path', {
        d: `M ${bx} ${by} C ${cx1} ${cy1} ${tx} ${ty - 4} ${tx} ${ty} C ${cx2} ${cy2} ${bx + side * 4} ${by + h * 0.6} ${bx} ${by} Z`,
        fill: `url(#${grad})`, stroke: c.leafStroke, 'stroke-width': '0.8', opacity: '0.85'
      });
    } else {
      // Healthy leaf: pointed teardrop
      const cx1 = bx + side * w * 0.6, cy1 = by - h;
      const tip = { x: bx + side * w, y: by - h * 0.2 };
      const cx2 = bx + side * w * 0.5, cy2 = by + h * 0.5;
      leafPath = svgEl('path', {
        d: `M ${bx} ${by} C ${cx1} ${cy1} ${tip.x} ${tip.y - 6} ${tip.x} ${tip.y} C ${cx2} ${cy2} ${bx + side * 3} ${by + h * 0.3} ${bx} ${by} Z`,
        fill: `url(#${grad})`, stroke: c.leafStroke, 'stroke-width': '0.8', opacity: '0.92'
      });
    }
    stemGroup.appendChild(leafPath);

    // Midrib vein
    if (!dry) {
      const tip2 = droop
        ? { x: bx + side * w, y: by + h * 0.4 }
        : { x: bx + side * w, y: by - h * 0.2 };
      const vein = svgEl('path', {
        d: `M ${bx} ${by} Q ${bx + side * w * 0.55} ${(by + tip2.y) / 2} ${tip2.x} ${tip2.y}`,
        stroke: c.leafStroke, 'stroke-width': '0.7', fill: 'none', opacity: '0.5'
      });
      stemGroup.appendChild(vein);
    }
  });

  // ── Flower ────────────────────────────────────────────────────────────────
  if (c.flower) {
    const fp = stemPoint(1); // tip of stem
    const fx = fp.x, fy = fp.y;
    const petalCount = 6;
    const petalLen = state === 'THRIVING' ? 11 : 8;
    const petalW   = state === 'THRIVING' ? 6  : 5;

    for (let i = 0; i < petalCount; i++) {
      const angle = (i / petalCount) * Math.PI * 2 - Math.PI / 2;
      const px = fx + Math.cos(angle) * petalLen;
      const py = fy + Math.sin(angle) * petalLen;
      const petal = svgEl('ellipse', {
        cx: px.toFixed(2), cy: py.toFixed(2),
        rx: petalW, ry: petalW * 0.55,
        fill: c.flower, opacity: '0.92',
        transform: `rotate(${(angle * 180 / Math.PI + 90).toFixed(1)}, ${px.toFixed(2)}, ${py.toFixed(2)})`
      });
      stemGroup.appendChild(petal);
    }
    // Center disk
    stemGroup.appendChild(svgEl('circle', { cx: fx.toFixed(2), cy: fy.toFixed(2), r: '5', fill: c.flowerCenter }));
    stemGroup.appendChild(svgEl('circle', { cx: fx.toFixed(2), cy: fy.toFixed(2), r: '2.5', fill: '#FFF9C4', opacity: '0.7' }));
  }

  // ── Dead X ────────────────────────────────────────────────────────────────
  if (state === 'DEAD') {
    const dp = stemPoint(1);
    [[-5,-5,5,5],[5,-5,-5,5]].forEach(([x1,y1,x2,y2]) => {
      stemGroup.appendChild(svgEl('line', {
        x1: dp.x + x1, y1: dp.y + y1, x2: dp.x + x2, y2: dp.y + y2,
        stroke: '#7A5C3A', 'stroke-width': '2.5', 'stroke-linecap': 'round'
      }));
    });
  }

  svg.appendChild(stemGroup);

  // ── Sparkles (THRIVING only) ──────────────────────────────────────────────
  if (state === 'THRIVING') {
    [[18, 72], [98, 62], [12, 108], [103, 96]].forEach(([sx, sy], i) => {
      const g = svgEl('g', { class: 'plant-sparkle' });
      // 4-pointed star
      const star = svgEl('path', {
        d: `M ${sx} ${sy-7} L ${sx+2} ${sy-2} L ${sx+7} ${sy} L ${sx+2} ${sy+2} L ${sx} ${sy+7} L ${sx-2} ${sy+2} L ${sx-7} ${sy} L ${sx-2} ${sy-2} Z`,
        fill: '#FFE066', opacity: '0.9'
      });
      g.appendChild(star);
      svg.appendChild(g);
    });
  }

  containerEl.appendChild(svg);
}
