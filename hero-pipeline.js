document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('heroPipelineCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  
  const resizeCanvas = () => {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
  };
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  let time = 0;
  const CYCLE_DURATION = 13; 

  const colors = {
    honeyBronze: '#d4940a',
    hyperMagenta: '#9333ea',
    coolHorizon: '#3b82f6',
    blueEnergy: '#2563eb',
    textPrimary: '#1a1a1a',
    textMuted: '#7a7a7a',
    bgElevated: '#f5f5f5',
    success: '#16a34a'
  };

  const getLayout = () => {
    const w = canvas.width / (window.devicePixelRatio || 1);
    const h = canvas.height / (window.devicePixelRatio || 1);
    
    return {
      w, h,
      stateSpace: {
        x: 40,
        y: 30,
        width: w * 0.28,
        height: h - 80 
      },
      tuples: {
        x: w * 0.38,
        y: 30,
        width: w * 0.22,
        height: h - 80  
      },
      output: {
        x: w * 0.68,
        y: (h - 40) / 2,  
        width: w * 0.28
      }
    };
  };

  const expertDemos = [
    { x: 0.2, y: 0.15 }, { x: 0.35, y: 0.22 }, { x: 0.55, y: 0.18 },
    { x: 0.75, y: 0.25 }, { x: 0.15, y: 0.38 }, { x: 0.4, y: 0.42 },
    { x: 0.6, y: 0.35 }, { x: 0.82, y: 0.4 }, { x: 0.25, y: 0.55 },
    { x: 0.48, y: 0.58 }, { x: 0.7, y: 0.52 }, { x: 0.85, y: 0.6 },
    { x: 0.12, y: 0.72 }, { x: 0.38, y: 0.75 }, { x: 0.58, y: 0.7 },
    { x: 0.78, y: 0.78 }, { x: 0.3, y: 0.88 }, { x: 0.65, y: 0.85 }
  ];

  const seededRandom = (seed) => {
    const x = Math.sin(seed * 9999) * 10000;
    return x - Math.floor(x);
  };
  
  const demoActions = expertDemos.map((_, i) => ({
    dx: (seededRandom(i * 2) - 0.5) * 0.5,
    dy: (seededRandom(i * 2 + 1) - 0.5) * 0.5
  }));

  const getQueryState = (t) => {
    const baseX = 0.45;
    const baseY = 0.5;
    return {
      x: baseX + Math.sin(t * 0.3) * 0.06,
      y: baseY + Math.cos(t * 0.4) * 0.04
    };
  };

  const findKNearest = (query, k = 4) => {
    const distances = expertDemos.map((demo, idx) => ({
      idx,
      demo,
      action: demoActions[idx],
      dist: Math.sqrt((demo.x - query.x) ** 2 + (demo.y - query.y) ** 2)
    }));
    distances.sort((a, b) => a.dist - b.dist);
    return distances.slice(0, k);
  };

  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
  const easeInOutCubic = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  const roundRect = (x, y, w, h, r) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  };

  const drawArrow = (fromX, fromY, toX, toY, color, alpha = 1, dashed = false, lineWidth = 2) => {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = lineWidth;
    
    if (dashed) {
      ctx.setLineDash([5, 3]);
    }
    
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();
    
    const angle = Math.atan2(toY - fromY, toX - fromX);
    const headLen = 6;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headLen * Math.cos(angle - Math.PI / 6), toY - headLen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(toX - headLen * Math.cos(angle + Math.PI / 6), toY - headLen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();
  };

  const drawActionArrow = (x, y, action, color, alpha = 1) => {
    const len = 18;
    const toX = x + action.dx * len * 2;
    const toY = y + action.dy * len * 2;
    drawArrow(x, y, toX, toY, color, alpha, false, 2);
  };

  const draw = () => {
    const layout = getLayout();
    const { w, h, stateSpace, tuples, output } = layout;
    
    ctx.clearRect(0, 0, w, h);

    const cycleTime = (time % CYCLE_DURATION) / CYCLE_DURATION;
    
    const query = getQueryState(time);
    const neighbors = findKNearest(query, 4);

    const getNeighborScreenPos = (n) => ({
      x: stateSpace.x + 15 + n.demo.x * (stateSpace.width - 30),
      y: stateSpace.y + 30 + n.demo.y * (stateSpace.height - 50)
    });
    
    const qx = stateSpace.x + 15 + query.x * (stateSpace.width - 30);
    const qy = stateSpace.y + 30 + query.y * (stateSpace.height - 50);

    ctx.fillStyle = colors.bgElevated;
    roundRect(stateSpace.x, stateSpace.y, stateSpace.width, stateSpace.height, 12);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.08)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.font = '600 11px Inter, sans-serif';
    ctx.fillStyle = colors.textMuted;
    ctx.textAlign = 'center';
    ctx.fillText('STATE SPACE', stateSpace.x + stateSpace.width / 2, stateSpace.y + 18);

    expertDemos.forEach((demo, idx) => {
      const px = stateSpace.x + 15 + demo.x * (stateSpace.width - 30);
      const py = stateSpace.y + 30 + demo.y * (stateSpace.height - 50);
      
      const neighborInfo = neighbors.find(n => n.idx === idx);
      const isNeighbor = !!neighborInfo;
      
      if (isNeighbor && cycleTime > 0.05) {
        const highlightAlpha = Math.min(1, (cycleTime - 0.05) / 0.06) * 0.3;
        ctx.fillStyle = `rgba(212, 148, 10, ${highlightAlpha})`;
        ctx.beginPath();
        ctx.arc(px, py, 14, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.fillStyle = isNeighbor && cycleTime > 0.05 ? colors.honeyBronze : colors.coolHorizon;
      ctx.globalAlpha = isNeighbor && cycleTime > 0.05 ? 1 : 0.5;
      ctx.beginPath();
      ctx.arc(px, py, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      
      if (isNeighbor && cycleTime > 0.15) {
        const actionAlpha = Math.min(1, (cycleTime - 0.15) / 0.08);
        drawActionArrow(px, py, demoActions[idx], colors.coolHorizon, actionAlpha * 0.8);
      }
    });

    ctx.fillStyle = 'rgba(147, 51, 234, 0.2)';
    ctx.beginPath();
    ctx.arc(qx, qy, 14 + Math.sin(time * 3) * 2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = colors.hyperMagenta;
    ctx.beginPath();
    ctx.arc(qx, qy, 7, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.font = '600 10px Inter, sans-serif';
    ctx.fillStyle = colors.hyperMagenta;
    ctx.textAlign = 'center';
    ctx.fillText('s', qx - 3, qy - 16);
    ctx.font = '600 7px Inter, sans-serif';
    ctx.fillText('q', qx + 4, qy - 13);

    if (cycleTime > 0.08) {
      const lineProgress = Math.min(1, (cycleTime - 0.08) / 0.10);
      neighbors.forEach((n, i) => {
        const pos = getNeighborScreenPos(n);
        
        const progress = easeOutCubic(Math.max(0, Math.min(1, lineProgress - i * 0.1)));
        if (progress > 0) {
          const midX = qx + (pos.x - qx) * progress;
          const midY = qy + (pos.y - qy) * progress;
          
          ctx.strokeStyle = colors.hyperMagenta;
          ctx.globalAlpha = 0.6;
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 3]);
          ctx.beginPath();
          ctx.moveTo(qx, qy);
          ctx.lineTo(midX, midY);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.globalAlpha = 1;
          
          if (progress > 0.8) {
            const labelX = qx + (pos.x - qx) * 0.5;
            const labelY = qy + (pos.y - qy) * 0.5 - 6;
            ctx.font = '600 9px Inter, sans-serif';
            ctx.fillStyle = colors.hyperMagenta;
            ctx.globalAlpha = (progress - 0.8) / 0.2;
            ctx.fillText('Δ', labelX, labelY);
            ctx.globalAlpha = 1;
          }
        }
      });
    }

    const cardHeight = 44;
    const cardGap = 10;
    const totalHeight = neighbors.length * cardHeight + (neighbors.length - 1) * cardGap;
    const startY = tuples.y + (tuples.height - totalHeight) / 2;
    
    if (cycleTime > 0.18) {
      const tupleProgress = Math.min(1, (cycleTime - 0.18) / 0.18);

      neighbors.forEach((n, i) => {
        const cardProgress = easeOutCubic(Math.max(0, Math.min(1, tupleProgress - i * 0.08)));
        if (cardProgress <= 0) return;

        const cardY = startY + i * (cardHeight + cardGap);
        const pos = getNeighborScreenPos(n);
        
        if (cardProgress > 0.3) {
          const lineAlpha = (cardProgress - 0.3) / 0.7 * 0.4;
          ctx.strokeStyle = colors.honeyBronze;
          ctx.globalAlpha = lineAlpha;
          ctx.lineWidth = 1;
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.moveTo(pos.x, pos.y);
          ctx.lineTo(tuples.x, cardY + cardHeight / 2);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.globalAlpha = 1;
        }
        
        ctx.save();
        ctx.globalAlpha = cardProgress;
        
        ctx.fillStyle = '#fff';
        ctx.shadowColor = 'rgba(0,0,0,0.08)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetY = 2;
        roundRect(tuples.x, cardY, tuples.width, cardHeight, 8);
        ctx.fill();
        ctx.shadowColor = 'transparent';
        
        ctx.strokeStyle = 'rgba(212, 148, 10, 0.3)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.font = '500 11px Fira Code, monospace';
        ctx.textAlign = 'left';
        
        const textY = cardY + cardHeight / 2 + 4;
        let textX = tuples.x + 10;
        
        ctx.fillStyle = colors.textMuted;
        ctx.fillText('(', textX, textY);
        textX += 8;
        
        ctx.fillStyle = colors.honeyBronze;
        ctx.fillText('s*', textX, textY);
        textX += 18;
        
        ctx.fillStyle = colors.textMuted;
        ctx.fillText(',', textX, textY);
        textX += 10;
        
        ctx.fillStyle = colors.coolHorizon;
        ctx.fillText('a*', textX, textY);
        textX += 18;
        
        ctx.fillStyle = colors.textMuted;
        ctx.fillText(',', textX, textY);
        textX += 10;
        
        ctx.fillStyle = colors.hyperMagenta;
        ctx.font = '600 11px Fira Code, monospace';
        ctx.fillText('Δs', textX, textY);
        textX += 20;
        
        ctx.fillStyle = colors.textMuted;
        ctx.font = '500 11px Fira Code, monospace';
        ctx.fillText(')', textX, textY);

        ctx.restore();
      });

      if (tupleProgress > 0.6) {
        ctx.globalAlpha = (tupleProgress - 0.6) / 0.4;
        ctx.font = '500 10px Inter, sans-serif';
        ctx.fillStyle = colors.textMuted;
        ctx.textAlign = 'center';
        ctx.fillText('embed with fθ', tuples.x + tuples.width / 2, startY + totalHeight + 18);
        ctx.globalAlpha = 1;
      }
    }

    if (cycleTime > 0.38) {
      const flowProgress = Math.min(1, (cycleTime - 0.38) / 0.08);
      const arrowAlpha = easeOutCubic(flowProgress);
      
      neighbors.forEach((_, i) => {
        const cardY = startY + i * (cardHeight + cardGap) + cardHeight / 2;
        const fromX = tuples.x + tuples.width + 5;
        const toX = output.x - 10;
        
        drawArrow(fromX, cardY, toX, output.y, colors.textMuted, arrowAlpha * 0.4, true, 1.5);
      });
    }

    if (cycleTime > 0.44) {
      const aggProgress = Math.min(1, (cycleTime - 0.44) / 0.08);
      
      ctx.save();
      ctx.globalAlpha = easeOutCubic(aggProgress);
      
      const aggRadius = 26;
      ctx.fillStyle = '#fff';
      ctx.shadowColor = 'rgba(0,0,0,0.1)';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(output.x, output.y, aggRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowColor = 'transparent';
      
      ctx.strokeStyle = colors.honeyBronze;
      ctx.lineWidth = 2;
      ctx.stroke();
      
      ctx.font = '600 20px serif';
      ctx.fillStyle = colors.honeyBronze;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Σ', output.x, output.y + 1);
      
      ctx.font = '500 9px Inter, sans-serif';
      ctx.fillStyle = colors.textMuted;
      ctx.textBaseline = 'alphabetic';
      ctx.fillText('aggregate', output.x, output.y + aggRadius + 14);
      
      ctx.restore();
    }

    if (cycleTime > 0.50) {
      const outProgress = Math.min(1, (cycleTime - 0.50) / 0.08);
      
      ctx.save();
      ctx.globalAlpha = easeOutCubic(outProgress);
      
      const aggRadius = 26;
      const outBoxX = output.x + 50;
      const outBoxW = 60;
      const outBoxH = 40;
      
      drawArrow(output.x + aggRadius + 5, output.y, outBoxX - 5, output.y, colors.blueEnergy, 1, false, 2);
      
      ctx.fillStyle = 'rgba(37, 99, 235, 0.1)';
      roundRect(outBoxX, output.y - outBoxH / 2, outBoxW, outBoxH, 10);
      ctx.fill();
      ctx.strokeStyle = colors.blueEnergy;
      ctx.lineWidth = 2;
      ctx.stroke();
      
      ctx.font = '700 15px Fira Code, monospace';
      ctx.fillStyle = colors.blueEnergy;
      ctx.textAlign = 'center';
      ctx.fillText('â', outBoxX + outBoxW / 2 - 5, output.y + 5);
      ctx.font = '600 10px Fira Code, monospace';
      ctx.fillText('q', outBoxX + outBoxW / 2 + 3, output.y + 7);
      
      ctx.font = '500 9px Inter, sans-serif';
      ctx.fillStyle = colors.textMuted;
      ctx.fillText('predicted', outBoxX + outBoxW / 2, output.y + outBoxH / 2 + 14);
      ctx.fillText('action', outBoxX + outBoxW / 2, output.y + outBoxH / 2 + 25);
      
      ctx.restore();
    }

    if (cycleTime > 0.55) {
      const insightAlpha = Math.min(1, (cycleTime - 0.55) / 0.08);
      
      ctx.save();
      ctx.globalAlpha = insightAlpha * 0.9;
      
      const insightY = h - 18;
      ctx.font = '500 12px Inter, sans-serif';
      ctx.fillStyle = colors.hyperMagenta;
      ctx.textAlign = 'center';
      
      const baseX = w / 2;
      ctx.textAlign = 'left';
      
      const part1 = 'Key insight: Δs = s* − s';
      const part2 = 'q';
      const part3 = ' captures local structure, enabling generalization';
      
      ctx.font = '500 12px Inter, sans-serif';
      const width1 = ctx.measureText(part1).width;
      ctx.font = '500 8px Inter, sans-serif';
      const width2 = ctx.measureText(part2).width;
      ctx.font = '500 12px Inter, sans-serif';
      const width3 = ctx.measureText(part3).width;
      
      const totalWidth = width1 + width2 + width3;
      const startX = baseX - totalWidth / 2;
      
      ctx.font = '500 12px Inter, sans-serif';
      ctx.fillText(part1, startX, insightY);
      
      ctx.font = '500 8px Inter, sans-serif';
      ctx.fillText(part2, startX + width1, insightY + 2);
      
      ctx.font = '500 12px Inter, sans-serif';
      ctx.fillText(part3, startX + width1 + width2, insightY);
      
      ctx.restore();
    }
  };

  const animate = () => {
    time += 0.016;
    draw();
    requestAnimationFrame(animate);
  };

  animate();
});
