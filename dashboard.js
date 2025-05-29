window.addEventListener('DOMContentLoaded', () => {

  const controls = d3.select('.sandbox-controls');
  controls.html(`
    <div style="display:flex;align-items:center;gap:1em;margin-bottom:1em;">
      <label style="color:#fff;font-weight:bold;">Player:
        <input id="player-input" list="player-list" placeholder="Enter player name" autocomplete="off" style="padding:0.4em 0.8em;font-size:1em;">
        <datalist id="player-list"></datalist>
      </label>
      <label style="color:#fff;font-weight:bold;">Count:
        <label><input type="radio" name="count" value="0-0" checked>0-0</label>
        <label><input type="radio" name="count" value="0-2">0-2</label>
      </label>
    </div>
  `);
  const inputElem = document.getElementById('player-input');
  const dataList = document.getElementById('player-list');
  const radios = Array.from(document.getElementsByName('count'));

  // Load data
  d3.csv('files/combined_data.csv', d3.autoType).then(data => {
    const players = Array.from(new Set(data.map(d=>d.batter_name.trim()).filter(n=>n))).sort();
    function populate(list) { dataList.innerHTML = list.map(n=>`<option value="${n}">`).join(''); }
    // Do NOT populate initially, so no suggestions show up until user types

    // Only show dropdown when there is input
    inputElem.addEventListener('input', ()=>{
      const v = inputElem.value.toLowerCase();
      populate(v ? players.filter(p=>p.toLowerCase().includes(v)).slice(0,10) : []);
    });

    // --- Find max values for each gauge field, rounded up to next 10 ---
    // Set attack angle max to 25 as requested
    function getMax(field) {
      if (field === 'attack_angle') return 25;
      const max = d3.max(data, d => +d[field]) || 1;
      return Math.ceil(max / 10) * 10;
    }
    const maxAttackAngle = getMax('attack_angle');
    const maxBatSpeed = getMax('bat_speed');
    const maxSwingPathTilt = Math.ceil((d3.max(data, d => Math.abs(+d.swing_path_tilt)) || 60) / 10) * 10;

    function getCount(){ const c=radios.find(r=>r.checked); return c?c.value:null; }
    function update(){
      const p = inputElem.value.trim();
      const c = getCount();
      let f = [];
      let showData = [];
      if (players.includes(p) && c) {
        f = data.filter(d=>d.batter_name===p && ((c==='0-0'&&d.balls===0&&d.strikes===0)||(c==='0-2'&&d.balls===0&&d.strikes===2)));
        showData = (f.length > 0) ? f : [];
      }
      // If no valid player or no data, show MLB average for selected count
      if (showData.length === 0 && c) {
        showData = data.filter(d => (c==='0-0'&&d.balls===0&&d.strikes===0)||(c==='0-2'&&d.balls===0&&d.strikes===2));
      }
      // If still empty (shouldn't happen), fallback to all data
      if (showData.length === 0) showData = data;
      gauge('#zone-map', showData, 'attack_angle', 'Attack Angle (°)', 0, maxAttackAngle);
      gauge('#outcome-scatter', showData, 'bat_speed', 'Bat Speed (mph)', 0, maxBatSpeed);
      gauge('#attack-angle-plot', showData, 'swing_path_tilt', 'Swing Path Tilt (°)', -maxSwingPathTilt, maxSwingPathTilt);
    }
    inputElem.addEventListener('change',update);
    inputElem.addEventListener('keyup',e=>{ if(e.key==='Enter')update(); });
    radios.forEach(r=>r.addEventListener('change',update));

    // --- Show MLB averages on initial load ---
    update();

    window.__statcast_full_data__ = data;
  });
});

// Reusable gauge function
function gauge(containerSel, data, field, title, minVal, maxVal) {
  if (field === 'bat_speed') {
    const sel = d3.select(containerSel);
    sel.html('');
    const width = 200, height = 200, cx = 100, cy = 100, r = 80;
    const svg = sel.append('svg')
      .attr('viewBox', '0 0 200 200')
      .attr('preserveAspectRatio', 'xMidYMid meet');
      
    // Title (original color)
    svg.append('text')
      .attr('x', 100)
      .attr('y', 20)
      .attr('text-anchor', 'middle')
      .attr('fill', "#b8860b")
      .style('font-size', '14px')
      .text(title);
      
    // Background arc (full gauge)
    const bgArc = d3.arc()
      .innerRadius(r * 0.75)
      .outerRadius(r * 0.85)
      .startAngle(-3 * Math.PI/4)
      .endAngle(3 * Math.PI/4);
    svg.append('path')
      .attr('d', bgArc())
      .attr('transform', `translate(${cx},${cy})`)
      .attr('fill', '#222');
      
    // -- Override scale domain for bat_speed to always be 0-100 --
    const scale = d3.scaleLinear()
      .domain([0, 100])
      .range([-3 * Math.PI/4, 3 * Math.PI/4]);
      
    const avg = d3.mean(data, d => +d[field]) || 0;
      
    // Foreground arc for value fill with transition (starts from 0)
    const fgArc = d3.arc()
      .innerRadius(r * 0.75)
      .outerRadius(r * 0.85)
      .startAngle(-3 * Math.PI/4);
    const fgPath = svg.append('path')
      .attr('transform', `translate(${cx},${cy})`)
      .attr('fill', "#b8860b");
    fgPath.transition().duration(1000)
      .attrTween('d', function() {
        const interp = d3.interpolate(-3 * Math.PI/4, scale(avg));
        return t => fgArc.endAngle(interp(t))();
      });
      
    // Draw needle pointer with initial angle at 0, then animate to scale(avg)
    const needle = svg.append('line')
      .attr('x1', cx)
      .attr('y1', cy)
      .attr('x2', cx + (r * 0.85) * Math.cos(scale(0) - Math.PI/2))
      .attr('y2', cy + (r * 0.85) * Math.sin(scale(0) - Math.PI/2))
      .attr('stroke', '#EE3311')
      .attr('stroke-width', 4);
    needle.transition().duration(1000)
      .attrTween("x2", function() {
        return function(t) {
          const currentAngle = scale(0) + (scale(avg) - scale(0)) * t;
          return cx + (r * 0.85) * Math.cos(currentAngle - Math.PI/2);
        };
      })
      .attrTween("y2", function() {
        return function(t) {
          const currentAngle = scale(0) + (scale(avg) - scale(0)) * t;
          return cy + (r * 0.85) * Math.sin(currentAngle - Math.PI/2);
        };
      });
      
    // Animated numeric value at center (shifted to cy+20)
    const textVal = svg.append('text')
      .attr('x', cx)
      .attr('y', cy + 20)
      .attr('text-anchor', 'middle')
      .attr('fill', "#b8860b")
      .style('font-size', '20px')
      .text('0');
    textVal.transition().delay(200).duration(1000)
      .tween('text', function() {
        const i = d3.interpolateNumber(0, avg);
        return t => d3.select(this).text(i(t).toFixed(1));
      });
      
    // Display MLB average at bottom (original color)
    let mlbAvg = null;
    if (window.__statcast_full_data__ && Array.isArray(window.__statcast_full_data__)) {
      mlbAvg = d3.mean(window.__statcast_full_data__, d => +d[field]);
    } else if (data && data.length > 0) {
      mlbAvg = d3.mean(data, d => +d[field]);
    }
    svg.append('text')
      .attr('x', 100)
      .attr('y', 190)
      .attr('text-anchor', 'middle')
      .attr('fill', "#b8860b")
      .style('font-family', 'Roboto Mono, monospace')
      .style('font-size', '12px')
      .text(mlbAvg !== null && !isNaN(mlbAvg) ? `MLB Average: ${mlbAvg.toFixed(1)}` : '');
      
    const tickGroup = svg.append('g');
    d3.range(0, 101, 20).forEach(tick => {
      const angle = scale(tick);
      // Set tick lines: start from slightly inside the gauge and extend beyond its edge.
      const lineStart = r * 0.75 - 8;
      const lineEnd = r * 0.75 + 15;
      const x1 = cx + lineStart * Math.cos(angle - Math.PI/2);
      const y1 = cy + lineStart * Math.sin(angle - Math.PI/2);
      const x2 = cx + lineEnd * Math.cos(angle - Math.PI/2);
      const y2 = cy + lineEnd * Math.sin(angle - Math.PI/2);
      tickGroup.append("line")
         .attr("x1", x1)
         .attr("y1", y1)
         .attr("x2", x2)
         .attr("y2", y2)
         .attr("stroke", "#fff")
         .attr("stroke-width", 2);
      // Tick labels: positioned just inside the gauge and colored gold.
      const labelRadius = r * 0.75 - 20;
      const lx = cx + labelRadius * Math.cos(angle - Math.PI/2);
      const ly = cy + labelRadius * Math.sin(angle - Math.PI/2) + 4;
      tickGroup.append("text")
         .attr("x", lx)
         .attr("y", ly)
         .attr("text-anchor", "middle")
         .attr("fill", "#b8860b")
         .style("font-size", "10px")
         .text(tick);
    });
    
  } else {
    const sel = d3.select(containerSel); 
    sel.html(''); 
    sel.style('overflow', 'hidden');
    const width = sel.node().clientWidth, height = sel.node().clientHeight; 
    const svg = sel.append('svg')
      .attr('viewBox', '0 0 200 200')
      .attr('preserveAspectRatio', 'xMidYMid meet');
    const cx = 100, cy = 120, r = 80;
    const avg = d3.mean(data, d => +d[field]) || 0;
  
    svg.append('text')
      .attr('x', 100)
      .attr('y', 20)
      .attr('text-anchor', 'middle')
      .attr('fill', '#b8860b')
      .style('font-size', '14px')
      .text(title);
  
    const background = d3.arc()
      .innerRadius(r * 0.7)
      .outerRadius(r * 0.9)
      .startAngle(-Math.PI / 2)
      .endAngle(Math.PI / 2);
    svg.append('path')
      .attr('d', background())
      .attr('transform', `translate(${cx},${cy})`)
      .attr('fill', '#222');
  
    const scale = d3.scaleLinear().domain([minVal, maxVal]).range([-Math.PI / 2, Math.PI / 2]);
    const fg = d3.arc()
      .innerRadius(r * 0.7)
      .outerRadius(r * 0.9)
      .startAngle(-Math.PI / 2);
    const arcPath = svg.append('path')
      .attr('transform', `translate(${cx},${cy})`)
      .attr('fill', '#b8860b');
  
    arcPath.transition().duration(1000).attrTween('d', () => t => fg.endAngle(scale(avg) * t)());
  
    const text = svg.append('text')
      .attr('x', cx)
      .attr('y', cy + 10)
      .attr('text-anchor', 'middle')
      .attr('fill', '#b8860b')
      .style('font-size', '20px')
      .text('0');
    text.transition().delay(200).duration(1000).tween('text', function () {
      const i = d3.interpolateNumber(0, avg);
      return t => d3.select(this).text(i(t).toFixed(1));
    });
  
    let mlbAvg = null;
    if (window.__statcast_full_data__ && Array.isArray(window.__statcast_full_data__)) {
      mlbAvg = d3.mean(window.__statcast_full_data__, d => +d[field]);
    } else if (data && data.length > 0) {
      mlbAvg = d3.mean(data, d => +d[field]);
    }
    svg.append('text')
      .attr('x', 100)
      .attr('y', 195)
      .attr('text-anchor', 'middle')
      .attr('fill', '#E63946')
      .style('font-family', 'Roboto Mono, monospace')
      .style('font-size', '12px')
      .text(mlbAvg !== null && !isNaN(mlbAvg) ? `MLB Average: ${mlbAvg.toFixed(1)}` : '');
  }
}