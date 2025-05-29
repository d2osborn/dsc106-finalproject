export function drawSwingPathTilt(containerSel, data, config) {
    // ...existing logic from the "if (field==='swing_path_tilt')" block...
    const svg = containerSel.append('svg')
        .attr('viewBox', '0 0 400 400')
        .attr('preserveAspectRatio', 'xMidYMid meet');
    // Use config.title, etc.
    // For consistency we use cx = 150, cy = 200.
    const cx = 150, cy = 200, r = 180;
    const lineLength = 250;
    // Title
    svg.append('text')
        .attr('x', cx)
        .attr('y', 50)
        .attr('text-anchor', 'middle')
        .attr('fill', "#b8860b")
        .style('font-size', '2vw')
        .text(config.title);
    // Pivot point
    const pivotX = cx + r * 0.85, pivotY = cy;
    // Dashed baseline
    const blackX = pivotX + lineLength * Math.cos(Math.PI);
    const blackY = pivotY - lineLength * Math.sin(Math.PI);
    svg.append('line')
        .attr('x1', pivotX)
        .attr('y1', pivotY)
        .attr('x2', blackX)
        .attr('y2', blackY)
        .attr('stroke', '#111')
        .attr('stroke-width', 3)
        .attr('stroke-dasharray', '8,6');
    // Angle mapping
    const angleScale = d3.scaleLinear()
         .domain([-config.max, config.max])
         .range([-Math.PI/3, Math.PI/3]);
    const avg = d3.mean(data, d => +d.swing_path_tilt) || 0;
    const theta = angleScale(avg);
    // Yellow polygon fill
    const fillPoly = svg.append('polygon')
         .attr('points', `${pivotX},${pivotY} ${blackX},${blackY} ${pivotX},${pivotY}`)
         .attr('fill', "#b8860b")
         .attr('opacity', 0.5);
    fillPoly.transition().duration(1000)
         .attrTween("points", function() {
             return t => {
                 const tipX = pivotX + lineLength * Math.cos(Math.PI - theta * t);
                 const tipY = pivotY - lineLength * Math.sin(Math.PI - theta * t);
                 return `${pivotX},${pivotY} ${blackX},${blackY} ${tipX},${tipY}`;
             };
         });
    // Red line animating to current tilt
    const redLine = svg.append('line')
         .attr('x1', pivotX)
         .attr('y1', pivotY)
         .attr('x2', blackX)
         .attr('y2', blackY)
         .attr('stroke', '#EE3311')
         .attr('stroke-width', 4);
    redLine.transition().duration(1000)
         .attrTween("x2", function() {
             const interp = d3.interpolate(blackX, pivotX + lineLength * Math.cos(Math.PI - theta));
             return t => interp(t);
         })
         .attrTween("y2", function() {
             const interp = d3.interpolate(blackY, pivotY - lineLength * Math.sin(Math.PI - theta));
             return t => interp(t);
         });
    // Bat remains unchanged
    const batGroup = svg.append('g')
         .attr('transform', `translate(${pivotX},${pivotY})`);
    batGroup.append('image')
         .attr('href', 'images/bat.png')
         .attr('x', -18)
         .attr('y', -lineLength)
         .attr('width', 36)
         .attr('height', lineLength);
    batGroup.transition().duration(1000)
         .attrTween("transform", function() {
             const interp = d3.interpolateNumber(0, theta * (180/Math.PI));
             return t => `translate(${pivotX},${pivotY}) rotate(${interp(t)})`;
         });
    // Numeric angle in white, 12px
    const textX = pivotX + (lineLength/2)*Math.cos(Math.PI - theta);
    const textY = pivotY - (lineLength/2)*Math.sin(Math.PI - theta);
    svg.append('text')
         .attr('x', textX)
         .attr('y', textY)
         .attr('text-anchor', 'middle')
         .attr('fill', '#fff')
         .style('font-size', '12px')
         .text(avg.toFixed(1) + "°");
    // Leave MLB average to dashboard.js
}
