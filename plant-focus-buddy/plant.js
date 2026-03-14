const STATE_COLORS = {
  THRIVING: { stem: '#2E9B44', leaf: '#4CC866', leafDark: '#259138', flower: '#FF8FAB', flowerCenter: '#FF4D6D', pot: '#D4522A', rim: '#E8724A', soil: '#5C3620' },
  HEALTHY:  { stem: '#2E9B44', leaf: '#4CC866', leafDark: '#259138', flower: '#FFD166', flowerCenter: '#F4A500', pot: '#D4522A', rim: '#E8724A', soil: '#5C3620' },
  OKAY:     { stem: '#7AAA32', leaf: '#A0CC48', leafDark: '#5A8024', flower: null,       flowerCenter: null,     pot: '#A85C28', rim: '#C07840', soil: '#4A2E18' },
  WILTING:  { stem: '#A89030', leaf: '#D4B840', leafDark: '#8A7020', flower: null,       flowerCenter: null,     pot: '#8A5820', rim: '#A87030', soil: '#3C2414' },
  DEAD:     { stem: '#8A7850', leaf: '#A89C70', leafDark: '#6A6040', flower: null,       flowerCenter: null,     pot: '#6A5030', rim: '#7A6040', soil: '#302018' },
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

function renderPlant(health, containerEl) {
  containerEl.innerHTML = '';
  const state = healthToState(health);
  const c = STATE_COLORS[state];

  const svg = svgEl('svg', { viewBox: '0 0 120 180', xmlns: 'http://www.w3.org/2000/svg' });

  // ── Drop shadow filter ─────────────────────────────────────────────────
  const defs = svgEl('defs', {});
  const filter = svgEl('filter', { id: 'pfb-shadow', x: '-20%', y: '-10%', width: '140%', height: '130%' });
  const blur = svgEl('feDropShadow', { dx: '0', dy: '3', stdDeviation: '4', 'flood-color': 'rgba(0,0,0,0.18)' });
  filter.appendChild(blur);
  defs.appendChild(filter);
  svg.appendChild(defs);

  // ── Pot ────────────────────────────────────────────────────────────────
  const potGroup = svgEl('g', { filter: 'url(#pfb-shadow)' });

  // Pot body — clean trapezoid with rounded bottom
  potGroup.appendChild(svgEl('path', {
    d: 'M 34 140 L 86 140 L 90 170 Q 90 175 85 175 L 35 175 Q 30 175 30 170 Z',
    fill: c.pot,
  }));
  // Pot rim — clean rounded rectangle
  potGroup.appendChild(svgEl('rect', {
    x: '31', y: '133', width: '58', height: '10', rx: '5',
    fill: c.rim,
  }));
  // Soil — flat ellipse
  potGroup.appendChild(svgEl('ellipse', {
    cx: '60', cy: '138', rx: '26', ry: '6',
    fill: c.soil,
  }));

  svg.appendChild(potGroup);

  // ── Plant group (animated) ─────────────────────────────────────────────
  const plantGroup = svgEl('g', { class: `plant-stem-group state-${state.toLowerCase()}` });

  // ── Stem ───────────────────────────────────────────────────────────────
  const stemHeights = { THRIVING: 80, HEALTHY: 68, OKAY: 58, WILTING: 50, DEAD: 38 };
  const stemH = stemHeights[state];
  const topY = 136 - stemH;

  let stemD;
  if (state === 'WILTING') {
    stemD = `M 60 136 Q 72 ${136 - stemH * 0.5} 62 ${topY}`;
  } else if (state === 'DEAD') {
    stemD = `M 60 136 Q 52 ${136 - stemH * 0.55} 66 ${topY}`;
  } else {
    stemD = `M 60 136 Q 58 ${136 - stemH * 0.5} 60 ${topY}`;
  }

  plantGroup.appendChild(svgEl('path', {
    d: stemD,
    stroke: c.stem, 'stroke-width': '5', fill: 'none', 'stroke-linecap': 'round',
  }));

  // ── Leaves — clean ellipses rotated about their stem attachment point ──
  const leafConfigs = {
    THRIVING: [
      { t: 0.28, side:  1, angle: -38, rx: 20, ry: 9 },
      { t: 0.56, side: -1, angle:  38, rx: 18, ry: 8 },
      { t: 0.78, side:  1, angle: -30, rx: 14, ry: 6 },
    ],
    HEALTHY: [
      { t: 0.30, side:  1, angle: -40, rx: 18, ry: 8 },
      { t: 0.62, side: -1, angle:  40, rx: 17, ry: 7.5 },
    ],
    OKAY: [
      { t: 0.32, side:  1, angle: -36, rx: 16, ry: 7 },
      { t: 0.65, side: -1, angle:  36, rx: 15, ry: 6.5 },
    ],
    WILTING: [
      { t: 0.32, side:  1, angle: 20, rx: 16, ry: 6.5 },
      { t: 0.65, side: -1, angle: -20, rx: 14, ry: 6 },
    ],
    DEAD: [
      { t: 0.55, side:  1, angle: 35, rx: 11, ry: 4.5 },
    ],
  };

  // Quadratic bezier point at parameter t
  function qPoint(t) {
    const pts = stemD.replace(/[MQ]/g, '').trim().split(/\s+/).map(Number);
    const [x0, y0, cx, cy, x1, y1] = pts;
    const mt = 1 - t;
    return {
      x: mt * mt * x0 + 2 * mt * t * cx + t * t * x1,
      y: mt * mt * y0 + 2 * mt * t * cy + t * t * y1,
    };
  }

  (leafConfigs[state] || []).forEach(({ t, side, angle, rx, ry }) => {
    const p = qPoint(t);
    // Leaf ellipse center offset outward from stem
    const cx = p.x + side * (rx * 0.7);
    const cy = p.y - ry * 0.5;
    const rotation = angle * (side < 0 ? -1 : 1);

    // Shadow ellipse (slightly larger, darker)
    plantGroup.appendChild(svgEl('ellipse', {
      cx, cy, rx: rx + 1, ry: ry + 1,
      fill: c.leafDark, opacity: '0.5',
      transform: `rotate(${rotation}, ${p.x}, ${p.y})`,
    }));
    // Leaf
    plantGroup.appendChild(svgEl('ellipse', {
      cx, cy, rx, ry,
      fill: c.leaf,
      transform: `rotate(${rotation}, ${p.x}, ${p.y})`,
    }));
  });

  // ── Flower ─────────────────────────────────────────────────────────────
  if (c.flower) {
    const fp = qPoint(1);
    const petalCount = 6;
    const petalDist = state === 'THRIVING' ? 11 : 9;
    const petalRx   = state === 'THRIVING' ? 7  : 5.5;
    const petalRy   = state === 'THRIVING' ? 4.5 : 3.5;

    for (let i = 0; i < petalCount; i++) {
      const a = (i / petalCount) * 360;
      const rad = (i / petalCount) * Math.PI * 2;
      const px = fp.x + Math.cos(rad) * petalDist;
      const py = fp.y + Math.sin(rad) * petalDist;
      plantGroup.appendChild(svgEl('ellipse', {
        cx: px.toFixed(2), cy: py.toFixed(2),
        rx: petalRx, ry: petalRy,
        fill: c.flower,
        transform: `rotate(${a}, ${px.toFixed(2)}, ${py.toFixed(2)})`,
      }));
    }
    // Center
    plantGroup.appendChild(svgEl('circle', {
      cx: fp.x.toFixed(2), cy: fp.y.toFixed(2), r: '6',
      fill: c.flowerCenter,
    }));
    // Highlight dot
    plantGroup.appendChild(svgEl('circle', {
      cx: (fp.x - 1.5).toFixed(2), cy: (fp.y - 1.5).toFixed(2), r: '2',
      fill: 'rgba(255,255,255,0.55)',
    }));
  }

  // ── Dead X ─────────────────────────────────────────────────────────────
  if (state === 'DEAD') {
    const dp = qPoint(1);
    [[-5,-5,5,5],[5,-5,-5,5]].forEach(([x1,y1,x2,y2]) => {
      plantGroup.appendChild(svgEl('line', {
        x1: dp.x+x1, y1: dp.y+y1, x2: dp.x+x2, y2: dp.y+y2,
        stroke: c.leafDark, 'stroke-width': '3', 'stroke-linecap': 'round',
      }));
    });
  }

  svg.appendChild(plantGroup);

  // ── Sparkles (THRIVING only) ───────────────────────────────────────────
  if (state === 'THRIVING') {
    [[18, 68], [100, 58], [14, 106], [104, 94]].forEach(([sx, sy]) => {
      const g = svgEl('g', { class: 'plant-sparkle' });
      g.appendChild(svgEl('path', {
        d: `M ${sx} ${sy-6} L ${sx+2} ${sy-2} L ${sx+6} ${sy} L ${sx+2} ${sy+2} L ${sx} ${sy+6} L ${sx-2} ${sy+2} L ${sx-6} ${sy} L ${sx-2} ${sy-2} Z`,
        fill: '#FFE566',
      }));
      svg.appendChild(g);
    });
  }

  containerEl.appendChild(svg);
}
