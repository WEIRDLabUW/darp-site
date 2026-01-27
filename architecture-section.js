document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('architectureCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const neighborCardsContainer = document.getElementById('neighborCards');
  const aggregationPanel = document.getElementById('aggregationPanel');

  const POINT_COUNT = 150;
  const NEIGHBOR_COUNT = 5;
  const ARROW_LENGTH = 30;
  const POINT_RADIUS = 3;

  const resizeCanvas = () => {
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  };
  resizeCanvas();
  window.addEventListener('resize', () => {
    resizeCanvas();
    initExpertDemos();
    draw();
  });

  const expertDemos = [];
  const canvasW = () => canvas.width / window.devicePixelRatio;
  const canvasH = () => canvas.height / window.devicePixelRatio;

  const initExpertDemos = () => {
    expertDemos.length = 0;
    const centerX = canvasW() / 2;
    const centerY = canvasH() / 2;

    for (let i = 0; i < POINT_COUNT; i++) {
      const state = {
        x: Math.random() * canvasW(),
        y: Math.random() * canvasH()
      };

      const relX = state.x - centerX;
      const relY = state.y - centerY;
      let angle = Math.atan2(relY, relX);
      angle += Math.PI / 2;
      angle += (Math.random() - 0.5) * 0.8;

      const action = {
        dx: Math.cos(angle),
        dy: Math.sin(angle)
      };

      expertDemos.push({ state, action });
    }
  };

  initExpertDemos();

  let queryState = null;
  let hoverState = null;
  let nearestNeighbors = [];
  let hoverNeighbors = [];

  const distance = (p1, p2) => {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
  };

  const findNearestNeighbors = (query, k = NEIGHBOR_COUNT) => {
    const distances = expertDemos.map((demo, idx) => ({
      idx,
      dist: distance(query, demo.state),
      demo
    }));
    distances.sort((a, b) => a.dist - b.dist);
    return distances.slice(0, k);
  };

  const formatVector = (v) => {
    return `(${v.x.toFixed(1)}, ${v.y.toFixed(1)})`;
  };

  const formatAction = (a) => {
    return `(${a.dx.toFixed(3)}, ${a.dy.toFixed(3)})`;
  };

  const drawArrow = (context, fromX, fromY, toX, toY, color, lineWidth = 2, isDashed = false) => {
    const headlen = 8;
    const dx = toX - fromX;
    const dy = toY - fromY;
    const angle = Math.atan2(dy, dx);
    
    const shortenBy = headlen * 0.7;
    const lineEndX = toX - shortenBy * Math.cos(angle);
    const lineEndY = toY - shortenBy * Math.sin(angle);
    
    context.save();
    context.beginPath();
    if (isDashed) context.setLineDash([5, 3]);
    context.moveTo(fromX, fromY);
    context.lineTo(lineEndX, lineEndY);
    context.strokeStyle = color;
    context.lineWidth = lineWidth;
    context.stroke();
    context.restore();
    
    context.beginPath();
    context.moveTo(toX, toY);
    context.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
    context.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
    context.closePath();
    context.fillStyle = color;
    context.fill();
  };

  const draw = () => {
    const w = canvasW();
    const h = canvasH();

    ctx.fillStyle = '#fafafa';
    ctx.fillRect(0, 0, w, h);

    const activeNeighbors = queryState ? nearestNeighbors : hoverNeighbors;
    const isHoverOnly = !queryState && hoverState;

    expertDemos.forEach(demo => {
      const isNeighbor = activeNeighbors.some(n => n.demo === demo);
      const pointColor = isNeighbor ? '#dc2626' : '#9ca3af';
      const arrowColor = isNeighbor ? '#dc2626' : '#cbd5e0';
      const pointSize = isNeighbor ? 5 : POINT_RADIUS;
      const arrowWidth = isNeighbor ? 2.5 : 1.5;
      const alpha = isNeighbor ? (isHoverOnly ? 0.6 : 1.0) : 0.8;

      ctx.save();
      ctx.globalAlpha = alpha;
      const toX = demo.state.x + demo.action.dx * ARROW_LENGTH;
      const toY = demo.state.y + demo.action.dy * ARROW_LENGTH;
      drawArrow(ctx, demo.state.x, demo.state.y, toX, toY, arrowColor, arrowWidth, false);
      ctx.restore();

      ctx.fillStyle = pointColor;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(demo.state.x, demo.state.y, pointSize, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;
    });

    if (isHoverOnly && hoverNeighbors.length > 0) {
      ctx.save();
      ctx.globalAlpha = 0.5;

      let avgDx = 0, avgDy = 0;
      hoverNeighbors.forEach(n => {
        avgDx += n.prediction.dx;
        avgDy += n.prediction.dy;
      });
      avgDx /= hoverNeighbors.length;
      avgDy /= hoverNeighbors.length;
      hoverNeighbors.forEach(n => {
        drawArrow(ctx, hoverState.x, hoverState.y, n.demo.state.x, n.demo.state.y, '#16a34a', 1.5, true);
      });
      const toX = hoverState.x + avgDx * ARROW_LENGTH;
      const toY = hoverState.y + avgDy * ARROW_LENGTH;
      drawArrow(ctx, hoverState.x, hoverState.y, toX, toY, '#2563eb', 4, false);
      ctx.restore();
    }

    if (queryState && nearestNeighbors.length > 0) {
      nearestNeighbors.forEach(n => {
        drawArrow(ctx, queryState.x, queryState.y, n.demo.state.x, n.demo.state.y, '#16a34a', 1.5, true);
      });
    }

    if (isHoverOnly) {
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = '#2563eb';
      ctx.beginPath();
      ctx.arc(hoverState.x, hoverState.y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    if (queryState) {
      if (nearestNeighbors.length > 0) {
        let avgDx = 0, avgDy = 0;
        nearestNeighbors.forEach(n => {
          avgDx += n.prediction.dx;
          avgDy += n.prediction.dy;
        });
        avgDx /= nearestNeighbors.length;
        avgDy /= nearestNeighbors.length;

        const toX = queryState.x + avgDx * ARROW_LENGTH;
        const toY = queryState.y + avgDy * ARROW_LENGTH;
        drawArrow(ctx, queryState.x, queryState.y, toX, toY, '#2563eb', 4, false);
      }

      ctx.fillStyle = '#2563eb';
      ctx.shadowBlur = 10;
      ctx.shadowColor = 'rgba(37, 99, 235, 0.5)';
      ctx.beginPath();
      ctx.arc(queryState.x, queryState.y, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  };

  const updateNeighborCards = (state = queryState, neighbors = nearestNeighbors) => {
    neighborCardsContainer.innerHTML = '';

    if (!state || neighbors.length === 0) {
      neighborCardsContainer.innerHTML = `
        <div class="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M12 6v6l4 2"></path>
          </svg>
          <p>Hover or click to begin</p>
        </div>
      `;
      return;
    }

    neighbors.forEach((n, idx) => {
      const delta = {
        x: n.demo.state.x - state.x,
        y: n.demo.state.y - state.y
      };

      const createVectorSVG = (vec, color, dashed = false, isAction = true) => {
        const centerX = 30;
        const centerY = 20;
        
        const vx = vec.x !== undefined ? vec.x : vec.dx;
        const vy = vec.y !== undefined ? vec.y : vec.dy;
        
        const scale = isAction ? 22 : 0.8;
        
        const endX = centerX + vx * scale;
        const endY = centerY + vy * scale;
        
        const dx = endX - centerX;
        const dy = endY - centerY;
        const mag = Math.sqrt(dx * dx + dy * dy);
        
        if (mag < 2) {
          return `
            <svg width="60" height="40" viewBox="0 0 60 40" style="background: #fafafa; border-radius: 4px;">
              <circle cx="${centerX}" cy="${centerY}" r="2" fill="${color}" opacity="0.5" />
            </svg>
          `;
        }
        
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;
        const arrowSize = 4;
        
        const shortenAmount = mag > arrowSize ? arrowSize * 0.7 : 0;
        const lineEndX = endX - shortenAmount * Math.cos(angle * Math.PI / 180);
        const lineEndY = endY - shortenAmount * Math.sin(angle * Math.PI / 180);
        
        const dashStyle = dashed ? 'stroke-dasharray="3,2"' : '';
        const markerId = `arrow-${idx}-${color.replace('#', '')}-${dashed ? 'dash' : 'solid'}`;
        
        return `
          <svg width="60" height="40" viewBox="0 0 60 40" style="background: #fafafa; border-radius: 4px;">
            <defs>
              <marker id="${markerId}" markerWidth="4" markerHeight="4" refX="3" refY="2" orient="auto">
                <polygon points="0 0, 4 2, 0 4" fill="${color}" />
              </marker>
            </defs>
            <line x1="${centerX}" y1="${centerY}" x2="${lineEndX}" y2="${lineEndY}" 
                  stroke="${color}" stroke-width="2" ${dashStyle} marker-end="url(#${markerId})" />
          </svg>
        `;
      };

      const card = document.createElement('div');
      card.className = 'neighbor-card';
      card.innerHTML = `
        <div class="neighbor-header">
          <span class="neighbor-index">${idx + 1}</span>
          <span>Neighbor ${idx + 1}</span>
        </div>
        <div class="neighbor-data">
          <div class="data-row">
            <span class="data-label">s*:</span>
            <span class="data-value">${formatVector(n.demo.state)}</span>
          </div>
          <div class="data-row-vector">
            <span class="data-label">a*:</span>
            ${createVectorSVG(n.demo.action, '#dc2626', false, true)}
          </div>
          <div class="data-row-vector">
            <span class="data-label">Δ:</span>
            ${createVectorSVG(delta, '#16a34a', true, false)}
          </div>
        </div>
        <div class="arrow-icon">↓</div>
        <div class="prediction-output">
          <div class="prediction-label">f<sub>θ</sub>(s*, a*, Δ) →</div>
          <div class="prediction-visual">
            ${createVectorSVG(n.prediction, '#d4940a', false, true)}
            <span class="prediction-label-inline">a'<sub>${idx + 1}</sub></span>
          </div>
        </div>
      `;
      
      neighborCardsContainer.appendChild(card);
    });
  };

  const updateAggregation = (state = queryState, neighbors = nearestNeighbors) => {
    if (!state || neighbors.length === 0) {
      aggregationPanel.innerHTML = `
        <div class="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
          </svg>
          <p>Awaiting neighbor predictions</p>
        </div>
      `;
      return;
    }

    const avgAction = {
      dx: neighbors.reduce((sum, n) => sum + n.prediction.dx, 0) / neighbors.length,
      dy: neighbors.reduce((sum, n) => sum + n.prediction.dy, 0) / neighbors.length
    };

    const createAggVectorSVG = (vec, color, scale = 22) => {
      const centerX = 30;
      const centerY = 20;
      
      const vx = vec.x !== undefined ? vec.x : vec.dx;
      const vy = vec.y !== undefined ? vec.y : vec.dy;
      
      const endX = centerX + vx * scale;
      const endY = centerY + vy * scale;
      
      const dx = endX - centerX;
      const dy = endY - centerY;
      const mag = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx) * 180 / Math.PI;
      
      const arrowSize = 4;
      
      const shortenAmount = mag > arrowSize ? arrowSize * 0.7 : 0;
      const lineEndX = endX - shortenAmount * Math.cos(angle * Math.PI / 180);
      const lineEndY = endY - shortenAmount * Math.sin(angle * Math.PI / 180);
      
      const markerId = `arrow-agg-${color.replace('#', '')}`;
      
      return `
        <svg width="60" height="40" viewBox="0 0 60 40" style="background: #fafafa; border-radius: 4px;">
          <defs>
            <marker id="${markerId}" markerWidth="4" markerHeight="4" refX="3" refY="2" orient="auto">
              <polygon points="0 0, 4 2, 0 4" fill="${color}" />
            </marker>
          </defs>
          <line x1="${centerX}" y1="${centerY}" x2="${lineEndX}" y2="${lineEndY}" 
                stroke="${color}" stroke-width="2" marker-end="url(#${markerId})" />
        </svg>
      `;
    };

    aggregationPanel.innerHTML = `
      <div class="aggregation-active">
        <div class="aggregation-formula">
          <div class="formula-label">Aggregation Function g<sub>ψ</sub></div>
          <div class="formula-content">
            â<sub>q</sub> = <sup>1</sup>/<sub>k</sub> ∑<sub>i=1</sub><sup>k</sup> a'<sub>i</sub>
          </div>
        </div>
        
        <div class="prediction-list">
          ${neighbors.map((n, idx) => `
            <div class="prediction-item">
              <span class="prediction-item-label">a'<sub>${idx + 1}</sub></span>
              ${createAggVectorSVG(n.prediction, '#d4940a')}
            </div>
          `).join('')}
        </div>

        <div class="final-output">
          <div class="final-label">Final Action Prediction</div>
          <div class="final-visual">
            ${createAggVectorSVG(avgAction, '#2563eb', 22)}
            <span class="final-value-inline">â<sub>q</sub></span>
          </div>
        </div>
      </div>
    `;
  };

  const handleMouseMove = (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    hoverState = { x, y };
    hoverNeighbors = findNearestNeighbors(hoverState, NEIGHBOR_COUNT);

    hoverNeighbors.forEach((n, idx) => {
      const delta = {
        x: n.demo.state.x - hoverState.x,
        y: n.demo.state.y - hoverState.y
      };

      const prediction = {
        dx: n.demo.action.dx + delta.x * 0.015,
        dy: n.demo.action.dy + delta.y * 0.015
      };
      n.prediction = prediction;
    });

    if (!queryState) {
      draw();
      updateNeighborCards(hoverState, hoverNeighbors);
      updateAggregation(hoverState, hoverNeighbors);
    }
  };

  const handleMouseLeave = () => {
    hoverState = null;
    hoverNeighbors = [];
    
    if (!queryState) {
      draw();
      updateNeighborCards(null, []);
      updateAggregation(null, []);
    }
  };

  const handleClick = (e) => {
    if (queryState) {
      queryState = null;
      nearestNeighbors = [];
      draw();
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    queryState = { x, y };
    nearestNeighbors = findNearestNeighbors(queryState, NEIGHBOR_COUNT);

    nearestNeighbors.forEach((n, idx) => {
      const delta = {
        x: n.demo.state.x - queryState.x,
        y: n.demo.state.y - queryState.y
      };

      const prediction = {
        dx: n.demo.action.dx + delta.x * 0.015,
        dy: n.demo.action.dy + delta.y * 0.015
      };
      n.prediction = prediction;
    });

    draw();
    updateNeighborCards();
    updateAggregation();
  };

  canvas.addEventListener('mousemove', handleMouseMove);
  canvas.addEventListener('mouseleave', handleMouseLeave);
  canvas.addEventListener('click', handleClick);

  const setPanelHeights = () => {
    const rightPanel = aggregationPanel.closest('.arch-panel');
    const middlePanel = neighborCardsContainer.closest('.arch-panel');
    if (!rightPanel || !middlePanel) return;
    
    const referenceHeight = rightPanel.offsetHeight;
    
    const panelTitle = middlePanel.querySelector('.panel-title');
    const panelStyle = window.getComputedStyle(middlePanel);
    const panelPadding = parseFloat(panelStyle.paddingTop) + parseFloat(panelStyle.paddingBottom);
    const titleHeight = panelTitle ? panelTitle.offsetHeight + parseFloat(window.getComputedStyle(panelTitle).marginBottom) : 0;
    
    const availableHeight = referenceHeight - panelPadding - titleHeight;
    
    if (availableHeight > 0) {
      neighborCardsContainer.style.height = `${availableHeight}px`;
      neighborCardsContainer.style.maxHeight = `${availableHeight}px`;
    }
  };

  setTimeout(setPanelHeights, 100);
  window.addEventListener('resize', setPanelHeights);

  draw();
});
