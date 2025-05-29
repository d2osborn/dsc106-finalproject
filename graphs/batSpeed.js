export function drawBatSpeed(containerSel, data, config) {
    // ...existing logic from the "if (field==='bat_speed')" block...
    const svg = containerSel.append('svg')
        .attr('viewBox', '0 0 200 200')
        .attr('preserveAspectRatio', 'xMidYMid meet');
    svg.append('text')
        .attr('x', 100).attr('y', 20)
        .attr('text-anchor', 'middle')
        .attr('fill', "#b8860b")
        .style('font-size', '14px')
        .text(config.title);
    const r = 80, cx = 100, cy = 100;
    const bgArc = d3.arc()
        .innerRadius(r * 0.75)
        .outerRadius(r * 0.85)
        .startAngle(-3 * Math.PI/4)
        .endAngle(3 * Math.PI/4);
    svg.append('path')
        .attr('d', bgArc())
        .attr('transform', `translate(${cx},${cy})`)
        .attr('fill', '#222');
    const scale = d3.scaleLinear().domain([0, 100]).range([-3 * Math.PI/4, 3 * Math.PI/4]);
    const avg = d3.mean(data, d => +d.bat_speed) || 0;
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
    const needle = svg.append('line')
        .attr('x1', cx).attr('y1', cy)
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
    svg.append('text')
         .attr('x', cx)
         .attr('y', cy + 20)
         .attr('text-anchor', 'middle')
         .attr('fill', "#b8860b")
         .style('font-size', '20px')
         .text(avg.toFixed(1));
    // Leave ticks and MLB average call to dashboard.js
}
