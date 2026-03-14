const STATE_COLORS = {
  THRIVING: { stem: '#2D8A3E', leaf: '#3DA84E', flower: '#F6D145', pot: '#C1440E' },
  HEALTHY:  { stem: '#2D8A3E', leaf: '#4AAF5A', flower: '#F9A825', pot: '#C1440E' },
  OKAY:     { stem: '#5C8C3A', leaf: '#8DB84A', flower: null,      pot: '#A0522D' },
  WILTING:  { stem: '#8B7D3A', leaf: '#B0A050', flower: null,      pot: '#8B6914' },
  DEAD:     { stem: '#6B5A2A', leaf: '#8B7D5A', flower: null,      pot: '#7A5C3A' }
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
  for (const [k, v] of Object.entries(attrs)) {
    el.setAttribute(k, v);
  }
  return el;
}

function renderPlant(health, containerEl) {
  containerEl.innerHTML = '';
  const state = healthToState(health);
  const colors = STATE_COLORS[state];

  const svg = svgEl('svg', { viewBox: '0 0 120 180', xmlns: 'http://www.w3.org/2000/svg' });

  // Pot (trapezoid using polygon)
  const pot = svgEl('polygon', {
    points: '35,140 85,140 90,170 30,170',
    fill: colors.pot,
    stroke: '#000',
    'stroke-width': '1'
  });
  svg.appendChild(pot);

  // Soil ellipse
  const soil = svgEl('ellipse', {
    cx: '60', cy: '140', rx: '25', ry: '8',
    fill: '#5C3D1E'
  });
  svg.appendChild(soil);

  // Stem group (animated)
  const stemGroup = svgEl('g', {
    class: `plant-stem-group state-${state.toLowerCase()}`
  });

  // Stem heights by state
  const stemHeights = { THRIVING: 80, HEALTHY: 70, OKAY: 60, WILTING: 50, DEAD: 40 };
  const stemH = stemHeights[state];
  const stemTopY = 138 - stemH;

  let stemPath;
  if (state === 'WILTING') {
    // Curved/drooped stem
    stemPath = svgEl('path', {
      d: `M 60 138 Q 75 ${138 - stemH * 0.5} 65 ${stemTopY}`,
      stroke: colors.stem,
      'stroke-width': '4',
      fill: 'none',
      'stroke-linecap': 'round'
    });
  } else if (state === 'DEAD') {
    // Bent stem
    stemPath = svgEl('path', {
      d: `M 60 138 Q 55 ${138 - stemH * 0.6} 70 ${stemTopY}`,
      stroke: colors.stem,
      'stroke-width': '4',
      fill: 'none',
      'stroke-linecap': 'round'
    });
  } else {
    // Straight stem
    stemPath = svgEl('path', {
      d: `M 60 138 L 60 ${stemTopY}`,
      stroke: colors.stem,
      'stroke-width': '4',
      fill: 'none',
      'stroke-linecap': 'round'
    });
  }
  stemGroup.appendChild(stemPath);

  // Leaves
  const leafCounts = { THRIVING: 3, HEALTHY: 2, OKAY: 2, WILTING: 2, DEAD: 1 };
  const numLeaves = leafCounts[state];

  for (let i = 0; i < numLeaves; i++) {
    const leafY = stemTopY + stemH * (0.3 + i * 0.25);
    const side = i % 2 === 0 ? 1 : -1; // alternate sides

    let leafPath;
    if (state === 'WILTING') {
      // Drooped leaf
      leafPath = svgEl('path', {
        d: `M 60 ${leafY} Q ${60 + side * 25} ${leafY + 15} ${60 + side * 15} ${leafY + 25}`,
        stroke: colors.leaf,
        'stroke-width': '2',
        fill: colors.leaf,
        opacity: '0.9'
      });
    } else if (state === 'DEAD') {
      // Dry small leaf
      leafPath = svgEl('path', {
        d: `M 62 ${leafY} Q ${62 + side * 15} ${leafY + 5} ${62 + side * 10} ${leafY + 18}`,
        stroke: colors.leaf,
        'stroke-width': '2',
        fill: colors.leaf,
        opacity: '0.7'
      });
    } else {
      // Normal leaf
      leafPath = svgEl('path', {
        d: `M 60 ${leafY} Q ${60 + side * 28} ${leafY - 10} ${60 + side * 18} ${leafY + 15}`,
        stroke: colors.leaf,
        'stroke-width': '2',
        fill: colors.leaf,
        opacity: '0.9'
      });
    }
    stemGroup.appendChild(leafPath);
  }

  // Flower (THRIVING and HEALTHY only)
  if (colors.flower && (state === 'THRIVING' || state === 'HEALTHY')) {
    const flowerX = state === 'WILTING' ? 65 : 60;
    const flowerY = stemTopY;
    const petalR = state === 'THRIVING' ? 8 : 6;
    const numPetals = 6;

    for (let i = 0; i < numPetals; i++) {
      const angle = (i / numPetals) * Math.PI * 2;
      const px = flowerX + Math.cos(angle) * (petalR + 2);
      const py = flowerY + Math.sin(angle) * (petalR + 2);
      const petal = svgEl('circle', {
        cx: px.toFixed(1), cy: py.toFixed(1), r: petalR,
        fill: colors.flower,
        opacity: '0.9'
      });
      stemGroup.appendChild(petal);
    }
    // Flower center
    const center = svgEl('circle', {
      cx: flowerX, cy: flowerY, r: '5',
      fill: '#FFF176'
    });
    stemGroup.appendChild(center);
  }

  // Dead indicator (X at stem tip)
  if (state === 'DEAD') {
    const dx = 70, dy = stemTopY;
    const line1 = svgEl('line', {
      x1: dx - 6, y1: dy - 6, x2: dx + 6, y2: dy + 6,
      stroke: '#5C3317', 'stroke-width': '2.5', 'stroke-linecap': 'round'
    });
    const line2 = svgEl('line', {
      x1: dx + 6, y1: dy - 6, x2: dx - 6, y2: dy + 6,
      stroke: '#5C3317', 'stroke-width': '2.5', 'stroke-linecap': 'round'
    });
    stemGroup.appendChild(line1);
    stemGroup.appendChild(line2);
  }

  svg.appendChild(stemGroup);

  // Sparkles (THRIVING only)
  if (state === 'THRIVING') {
    const sparklePositions = [
      [20, 80], [100, 70], [15, 110], [105, 100]
    ];
    sparklePositions.forEach(([sx, sy], idx) => {
      const sparkle = svgEl('g', { class: 'plant-sparkle' });
      // Diamond shape: 4-pointed star
      const d = `M ${sx} ${sy-6} L ${sx+3} ${sy} L ${sx} ${sy+6} L ${sx-3} ${sy} Z`;
      const diamond = svgEl('path', {
        d, fill: '#F6D145', opacity: '0.85'
      });
      sparkle.appendChild(diamond);
      svg.appendChild(sparkle);
    });
  }

  containerEl.appendChild(svg);
}
