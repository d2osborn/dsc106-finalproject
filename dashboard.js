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
    function getMax(field) {
      const max = d3.max(data, d => +d[field]) || 1;
      return Math.ceil(max / 10) * 10;
    }
    const maxAttackAngle = getMax('attack_angle');
    const maxBatSpeed = getMax('bat_speed');
    const maxSwingPathTilt = Math.ceil((d3.max(data, d => Math.abs(+d.swing_path_tilt)) || 60) / 10) * 10;

    function getCount(){ const c=radios.find(r=>r.checked); return c?c.value:null; }
    function update(){
      const p=inputElem.value.trim(); if(!players.includes(p)) return;
      const c=getCount(); if(!c) return;
      const f=data.filter(d=>d.batter_name===p && ((c==='0-0'&&d.balls===0&&d.strikes===0)||(c==='0-2'&&d.balls===0&&d.strikes===2)));
      gauge('#zone-map', f, 'attack_angle', 'Attack Angle (°)', 0, maxAttackAngle);
      gauge('#outcome-scatter', f, 'bat_speed', 'Bat Speed (mph)', 0, maxBatSpeed);
      gauge('#attack-angle-plot', f, 'swing_path_tilt', 'Swing Path Tilt (°)', -maxSwingPathTilt, maxSwingPathTilt);
    }
    inputElem.addEventListener('change',update);
    inputElem.addEventListener('keyup',e=>{ if(e.key==='Enter')update(); });
    radios.forEach(r=>r.addEventListener('change',update));


    window.__statcast_full_data__ = data;
  });
});

// Reusable gauge function
function gauge(containerSel, data, field, title, minVal, maxVal) {
  const sel = d3.select(containerSel); sel.html(''); sel.style('overflow', 'hidden');
  const width = sel.node().clientWidth, height = sel.node().clientHeight; const size = Math.min(width, height);
  const svg = sel.append('svg').attr('viewBox', '0 0 200 200').attr('preserveAspectRatio', 'xMidYMid meet');
  const cx = 100, cy = 120, r = 80;
  const avg = d3.mean(data, d => +d[field]) || 0;


  svg.append('text')
    .attr('x', 100).attr('y', 20)
    .attr('text-anchor', 'middle')
    .attr('fill', '#b8860b')
    .style('font-size', '14px')
    .text(title);


  const background = d3.arc().innerRadius(r * 0.7).outerRadius(r * 0.9).startAngle(-Math.PI / 2).endAngle(Math.PI / 2);
  svg.append('path')
    .attr('d', background())
    .attr('transform', `translate(${cx},${cy})`)
    .attr('fill', '#222');


  const scale = d3.scaleLinear().domain([minVal, maxVal]).range([-Math.PI / 2, Math.PI / 2]);
  const fg = d3.arc().innerRadius(r * 0.7).outerRadius(r * 0.9).startAngle(-Math.PI / 2);
  const arcPath = svg.append('path').attr('transform', `translate(${cx},${cy})`).attr('fill', '#b8860b');
 
  arcPath.transition().duration(1000).attrTween('d', () => t => fg.endAngle(scale(avg) * t)());


  const text = svg.append('text')
    .attr('x', cx).attr('y', cy + 10)
    .attr('text-anchor', 'middle')
    .attr('fill', '#b8860b')
    .style('font-size', '20px')
    .text('0');
  text.transition().delay(200).duration(1000).tween('text', function () {
    const i = d3.interpolateNumber(0, avg); return t => d3.select(this).text(i(t).toFixed(1));
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
    .text(
      mlbAvg !== null && !isNaN(mlbAvg)
        ? `MLB Average: ${mlbAvg.toFixed(1)}`
        : ''
    );
}
