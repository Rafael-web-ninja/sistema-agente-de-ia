// Custom High-Precision SVG Charts

export function renderConversasAreaChart(containerId, data) {
  const container = document.getElementById(containerId);
  if (!container) return;

  function draw() {
    const width = container.clientWidth || 640;
    const height = 210;
    const paddingLeft = 40;
    const paddingRight = 16;
    const paddingTop = 18;
    const paddingBottom = 28;

    const chartWidth = Math.max(width - paddingLeft - paddingRight, 100);
    const chartHeight = height - paddingTop - paddingBottom;

    const maxValue = 200;
    const labels = data?.labels || ['29/08', '30/08', '31/08', '01/09', '02/09', '03/09', '04/09'];
    const values = data?.values || [68, 105, 128, 148, 128, 110, 92];

    const points = values.map((val, idx) => {
      const x = paddingLeft + (idx / (values.length - 1)) * chartWidth;
      const y = paddingTop + chartHeight - (val / maxValue) * chartHeight;
      return { x, y, val, label: labels[idx] };
    });

    // Calculate smooth bezier path
    let pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cpX = (p0.x + p1.x) / 2;
      pathD += ` C ${cpX} ${p0.y}, ${cpX} ${p1.y}, ${p1.x} ${p1.y}`;
    }

    const areaD = `${pathD} L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${points[0].x} ${paddingTop + chartHeight} Z`;

    // Grid lines and Y-axis numbers
    const gridY = [0, 50, 100, 150, 200];
    const gridLinesSvg = gridY.map(val => {
      const y = paddingTop + chartHeight - (val / maxValue) * chartHeight;
      return `
        <line x1="${paddingLeft}" y1="${y}" x2="${width - paddingRight}" y2="${y}" stroke="var(--border-light)" stroke-dasharray="3,3" stroke-width="1" />
        <text x="${paddingLeft - 10}" y="${y + 4}" font-size="11.5" font-weight="500" fill="var(--text-muted)" text-anchor="end" font-family="system-ui, -apple-system, sans-serif">${val}</text>
      `;
    }).join('');

    // X-axis labels
    const xLabelsSvg = points.map(p => `
      <text x="${p.x}" y="${height - 6}" font-size="11.5" font-weight="500" fill="var(--text-muted)" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">${p.label}</text>
    `).join('');

    // Points and hover circles (perfectly round circles)
    const circlesSvg = points.map(p => `
      <circle cx="${p.x}" cy="${p.y}" r="4.5" fill="#00A868" stroke="#FFFFFF" stroke-width="2.5" class="chart-point" data-val="${p.val}" data-date="${p.label}" style="cursor: pointer; transition: r 0.15s ease;">
        <title>${p.label}: ${p.val} conversas</title>
      </circle>
    `).join('');

    container.innerHTML = `
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="display: block; width: 100%; height: 100%;">
        <defs>
          <linearGradient id="areaGreenGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#00A868" stop-opacity="0.32"/>
            <stop offset="100%" stop-color="#00A868" stop-opacity="0.01"/>
          </linearGradient>
        </defs>
        ${gridLinesSvg}
        <path d="${areaD}" fill="url(#areaGreenGrad)" />
        <path d="${pathD}" fill="none" stroke="#00A868" stroke-width="2.8" stroke-linecap="round" />
        ${circlesSvg}
        ${xLabelsSvg}
      </svg>
    `;
  }

  draw();

  // Watch for container resize to redraw crisp without any distortion
  if (window.ResizeObserver && !container._chartResizeObserver) {
    container._chartResizeObserver = new ResizeObserver(() => {
      draw();
    });
    container._chartResizeObserver.observe(container);
  }
}

export function renderPlanUsageDonut(containerId, percent = 49) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const size = 170;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  container.innerHTML = `
    <div style="position: relative; width: ${size}px; height: ${size}px; margin: 0 auto;">
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="transform: rotate(-90deg);">
        <!-- Background Track -->
        <circle
          cx="${size / 2}"
          cy="${size / 2}"
          r="${radius}"
          fill="none"
          stroke="var(--border-light)"
          stroke-width="${strokeWidth}"
        />
        <!-- Active Progress Arc -->
        <circle
          cx="${size / 2}"
          cy="${size / 2}"
          r="${radius}"
          fill="none"
          stroke="#00A868"
          stroke-width="${strokeWidth}"
          stroke-dasharray="${circumference}"
          stroke-dashoffset="${strokeDashoffset}"
          stroke-linecap="round"
          style="transition: stroke-dashoffset 0.8s ease-in-out;"
        />
      </svg>
      <!-- Center Content -->
      <div style="position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; pointer-events: none;">
        <span style="font-size: 32px; font-weight: 800; color: var(--text-main); line-height: 1.1;">${percent}%</span>
        <span style="font-size: 11px; color: var(--text-muted); margin-top: 3px;">de 10.000 conversas</span>
      </div>
    </div>
  `;
}

export function renderAgentsBarChart(containerId, history) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const width = 500;
  const height = 160;
  const paddingLeft = 35;
  const paddingRight = 15;
  const paddingTop = 15;
  const paddingBottom = 25;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;
  const maxValue = 150;

  const gridY = [0, 50, 100, 150];
  const gridSvg = gridY.map(val => {
    const y = paddingTop + chartHeight - (val / maxValue) * chartHeight;
    return `
      <line x1="${paddingLeft}" y1="${y}" x2="${width - paddingRight}" y2="${y}" stroke="var(--border-light)" stroke-width="1" />
      <text x="${paddingLeft - 6}" y="${y + 3}" font-size="9" fill="var(--text-muted)" text-anchor="end">${val}</text>
    `;
  }).join('');

  const groupWidth = chartWidth / history.length;
  const barW = 6;
  const barGap = 2;

  const barsSvg = history.map((item, idx) => {
    const groupX = paddingLeft + idx * groupWidth + (groupWidth - (barW * 3 + barGap * 2)) / 2;

    const hConv = (item.conversas / maxValue) * chartHeight;
    const yConv = paddingTop + chartHeight - hConv;

    const hRes = (item.resolvidas / maxValue) * chartHeight;
    const yRes = paddingTop + chartHeight - hRes;

    const hTrans = (item.transferencias / maxValue) * chartHeight;
    const yTrans = paddingTop + chartHeight - hTrans;

    return `
      <g class="bar-group">
        <!-- Conversas (Dark Green) -->
        <rect x="${groupX}" y="${yConv}" width="${barW}" height="${hConv}" rx="2" fill="#00A868">
          <title>${item.date} - Conversas: ${item.conversas}</title>
        </rect>
        <!-- Resolvidas (Light Green) -->
        <rect x="${groupX + barW + barGap}" y="${yRes}" width="${barW}" height="${hRes}" rx="2" fill="#86EFAC">
          <title>${item.date} - Resolvidas: ${item.resolvidas}</title>
        </rect>
        <!-- Transferências (Amber) -->
        <rect x="${groupX + (barW + barGap) * 2}" y="${yTrans}" width="${barW}" height="${hTrans}" rx="2" fill="#F59E0B">
          <title>${item.date} - Transferências: ${item.transferencias}</title>
        </rect>
        <!-- X label -->
        <text x="${groupX + (barW * 3 + barGap * 2) / 2}" y="${height - 8}" font-size="9" fill="var(--text-muted)" text-anchor="middle">${item.date}</text>
      </g>
    `;
  }).join('');

  container.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" style="width:100%; height:100%;">
      ${gridSvg}
      ${barsSvg}
    </svg>
  `;
}
