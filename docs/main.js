// =====================================
// SoCoTechDiving - Hero Pressure Gauge
// =====================================

(function () {
  const MIXES = {
    air:    { label: "Compressed Air",  short: "AIR",        o2: 21, n2: 79, he: 0,  psi: 3000, color: "#00d4ff" },
    ean32:  { label: "Nitrox 32%",       short: "EAN 32",     o2: 32, n2: 68, he: 0,  psi: 3000, color: "#4be2ff" },
    ean36:  { label: "Nitrox 36%",       short: "EAN 36",     o2: 36, n2: 64, he: 0,  psi: 3000, color: "#67e8f9" },
    trimix: { label: "Trimix 21/35",     short: "TRIMIX",     o2: 21, n2: 44, he: 35, psi: 3442, color: "#b76aff" },
    oxygen: { label: "100% Oxygen",      short: "O\u2082",    o2: 100, n2: 0, he: 0,  psi: 2400, color: "#ff6b35" },
  };

  const PSI_MAX = 4000;

  // Build the gauge SVG once
  const gaugeSvg = document.querySelector(".gauge-svg");
  if (!gaugeSvg) return;

  // Gauge geometry - viewBox 400x400, dial sweeps -135° (left bottom) to +135° (right bottom)
  const CX = 200, CY = 200, R_OUTER = 188, R_INNER = 144;
  const ARC_START = -135, ARC_END = 135;

  function polar(angleDeg, r) {
    const a = (angleDeg - 90) * Math.PI / 180;
    return [CX + Math.cos(a) * r, CY + Math.sin(a) * r];
  }

  function arcPath(startA, endA, r) {
    const [sx, sy] = polar(startA, r);
    const [ex, ey] = polar(endA, r);
    const large = Math.abs(endA - startA) > 180 ? 1 : 0;
    return `M ${sx} ${sy} A ${r} ${r} 0 ${large} 1 ${ex} ${ey}`;
  }

  // Build gauge ticks + labels
  let ticks = "";
  let labels = "";
  const tickCount = 9; // 0..4000 PSI in steps of 500
  for (let i = 0; i <= tickCount - 1; i++) {
    const t = i / (tickCount - 1);
    const angle = ARC_START + t * (ARC_END - ARC_START);
    const major = i % 2 === 0;
    const r1 = R_OUTER - 4;
    const r2 = major ? R_OUTER - 22 : R_OUTER - 14;
    const [x1, y1] = polar(angle, r1);
    const [x2, y2] = polar(angle, r2);
    ticks += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${major ? 'rgba(245,242,234,0.85)' : 'rgba(245,242,234,0.35)'}" stroke-width="${major ? 2 : 1}" stroke-linecap="round"/>`;
    if (major) {
      const psi = (i * 500);
      const [lx, ly] = polar(angle, R_OUTER - 38);
      labels += `<text x="${lx}" y="${ly}" text-anchor="middle" dominant-baseline="central" fill="rgba(245,242,234,0.55)" font-family="IBM Plex Mono, monospace" font-size="11" letter-spacing="0.05em">${psi}</text>`;
    }
  }

  // Color zones (green/yellow/red typical pressure gauge)
  // Green: 0 - 3000, Yellow: 3000-3500, Red: 3500-4000
  function zoneArc(startPsi, endPsi, color, opacity) {
    const sA = ARC_START + (startPsi / PSI_MAX) * (ARC_END - ARC_START);
    const eA = ARC_START + (endPsi / PSI_MAX) * (ARC_END - ARC_START);
    return `<path d="${arcPath(sA, eA, R_INNER + 14)}" fill="none" stroke="${color}" stroke-width="6" stroke-linecap="butt" opacity="${opacity}"/>`;
  }

  gaugeSvg.innerHTML = `
    <defs>
      <radialGradient id="dialGrad" cx="50%" cy="40%" r="65%">
        <stop offset="0%" stop-color="#1a3a5c"/>
        <stop offset="70%" stop-color="#0a1929"/>
        <stop offset="100%" stop-color="#040c17"/>
      </radialGradient>
      <radialGradient id="centerGrad" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#2a4a6e"/>
        <stop offset="100%" stop-color="#0a1929"/>
      </radialGradient>
      <filter id="needleGlow">
        <feGaussianBlur stdDeviation="3"/>
        <feMerge>
          <feMergeNode/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>

    <!-- Outer bezel -->
    <circle cx="${CX}" cy="${CY}" r="196" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>
    <circle cx="${CX}" cy="${CY}" r="190" fill="#0a1929" stroke="rgba(255,255,255,0.18)" stroke-width="2"/>

    <!-- Dial face -->
    <circle cx="${CX}" cy="${CY}" r="180" fill="url(#dialGrad)"/>

    <!-- Color zones -->
    ${zoneArc(0, 3000, "#4ade80", 0.45)}
    ${zoneArc(3000, 3500, "#fbbf24", 0.55)}
    ${zoneArc(3500, 4000, "#ef4444", 0.6)}

    <!-- Ticks -->
    <g>${ticks}</g>

    <!-- Labels -->
    <g>${labels}</g>

    <!-- Brand mark on dial -->
    <text x="${CX}" y="${CY - 70}" text-anchor="middle" fill="rgba(245,242,234,0.4)" font-family="Bricolage Grotesque, sans-serif" font-size="10" letter-spacing="0.3em" font-weight="700">SOCO TECH</text>
    <text x="${CX}" y="${CY - 56}" text-anchor="middle" fill="rgba(0,212,255,0.6)" font-family="IBM Plex Mono, monospace" font-size="8" letter-spacing="0.2em">PSI · BAR</text>

    <!-- Needle group (will be rotated via transform on the .gauge-needle) -->
    <g class="gauge-needle" style="transform-origin: ${CX}px ${CY}px; transform: rotate(${ARC_START}deg); transition: transform 1.4s cubic-bezier(0.34, 1.32, 0.45, 1);">
      <line x1="${CX}" y1="${CY}" x2="${CX}" y2="${CY - 168}" stroke="#ff6b35" stroke-width="3" stroke-linecap="round" filter="url(#needleGlow)"/>
      <line x1="${CX}" y1="${CY}" x2="${CX}" y2="${CY + 28}" stroke="#ff6b35" stroke-width="4" stroke-linecap="round" opacity="0.85"/>
    </g>

    <!-- Center cap -->
    <circle cx="${CX}" cy="${CY}" r="18" fill="url(#centerGrad)" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>
    <circle cx="${CX}" cy="${CY}" r="6" fill="#00d4ff"/>
  `;

  // Wire up the selector
  const buttons = document.querySelectorAll(".gauge-selector button");
  const psiOut = document.querySelector(".gauge-psi");
  const mixLabel = document.querySelector(".gauge-mix-label");
  const needle = gaugeSvg.querySelector(".gauge-needle");

  const o2Bar = document.querySelector(".bar-o2");
  const n2Bar = document.querySelector(".bar-n2");
  const heBar = document.querySelector(".bar-he");

  let counter = null;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function animateNumber(from, to, dur, fn) {
    if (reduceMotion) { fn(to); return; }
    const start = performance.now();
    function step(now) {
      const t = Math.min(1, (now - start) / dur);
      // ease out cubic
      const e = 1 - Math.pow(1 - t, 3);
      fn(Math.round(from + (to - from) * e));
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  let currentPsi = 0;

  function setMix(key) {
    const m = MIXES[key];
    if (!m) return;

    buttons.forEach(b => b.classList.toggle("active", b.dataset.mix === key));

    const angle = ARC_START + (m.psi / PSI_MAX) * (ARC_END - ARC_START);
    needle.style.transform = `rotate(${angle}deg)`;

    // Needle color matches mix
    needle.querySelectorAll("line").forEach(ln => ln.setAttribute("stroke", m.color));

    mixLabel.textContent = m.label;

    // Animate PSI number
    animateNumber(currentPsi, m.psi, 1200, (v) => {
      psiOut.textContent = v.toLocaleString();
    });
    currentPsi = m.psi;

    // Update mix bar
    o2Bar.style.width = m.o2 + "%";
    o2Bar.style.background = "#ff6b35";
    n2Bar.style.width = m.n2 + "%";
    n2Bar.style.background = "#00d4ff";
    heBar.style.width = m.he + "%";
    heBar.style.background = "#b76aff";

    // Update legend numbers
    document.querySelector(".leg-o2 .val").textContent = m.o2 + "%";
    document.querySelector(".leg-n2 .val").textContent = m.n2 + "%";
    document.querySelector(".leg-he .val").textContent = m.he + "%";
  }

  buttons.forEach(b => {
    b.addEventListener("click", () => {
      if (counter) { clearInterval(counter); counter = null; }
      setMix(b.dataset.mix);
    });
  });

  // Auto-cycle on first load
  const order = ["air", "ean32", "ean36", "trimix", "oxygen"];
  let idx = 0;

  // Initial state - kick off after a brief delay so the needle sweeps from zero
  setTimeout(() => setMix("air"), reduceMotion ? 0 : 200);

  // Auto-cycle only when the visitor has not asked for reduced motion
  if (!reduceMotion) {
    counter = setInterval(() => {
      idx = (idx + 1) % order.length;
      setMix(order[idx]);
    }, 3800);
  }
})();
